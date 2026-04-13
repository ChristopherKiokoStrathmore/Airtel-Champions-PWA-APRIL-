// ============================================================================
// WEBHOOK HANDLERS
// Sales Intelligence Network - Airtel Kenya
// ============================================================================
// Handles webhooks from external services
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ============================================================================
// TYPES
// ============================================================================

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  signature?: string;
}

interface SMSWebhookPayload {
  message_id: string;
  phone_number: string;
  status: 'delivered' | 'failed' | 'sent';
  timestamp: string;
}

interface PhotoUploadWebhookPayload {
  file_id: string;
  user_id: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  upload_status: 'success' | 'failed';
  metadata?: {
    width?: number;
    height?: number;
    exif?: any;
  };
}

// ============================================================================
// SIGNATURE VERIFICATION
// ============================================================================

/**
 * Verify webhook signature
 * Prevents unauthorized webhook requests
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const key = encoder.encode(secret);

    // Create HMAC-SHA256 signature
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// ============================================================================
// SMS DELIVERY WEBHOOK (Africa's Talking)
// ============================================================================

/**
 * Handle SMS delivery status webhook from Africa's Talking
 * Updates OTP delivery status in database
 */
export async function handleSMSWebhook(payload: SMSWebhookPayload): Promise<void> {
  console.log('📱 SMS Webhook received:', payload);

  try {
    // Update OTP code status
    const { error } = await supabase
      .from('otp_codes')
      .update({
        delivery_status: payload.status,
        delivered_at: payload.status === 'delivered' ? payload.timestamp : null,
      })
      .eq('phone', payload.phone_number)
      .is('used', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Failed to update OTP delivery status:', error);
      return;
    }

    // If delivery failed, log it
    if (payload.status === 'failed') {
      await supabase.from('audit_logs').insert({
        action: 'SMS_DELIVERY_FAILED',
        table_name: 'otp_codes',
        metadata: {
          phone: payload.phone_number,
          messageId: payload.message_id,
        },
      });
    }

    console.log(`✅ SMS status updated: ${payload.status}`);
  } catch (error) {
    console.error('Error handling SMS webhook:', error);
    throw error;
  }
}

// ============================================================================
// PHOTO UPLOAD WEBHOOK (Cloudinary / S3)
// ============================================================================

/**
 * Handle photo upload completion webhook
 * Updates submission with photo URL and metadata
 */
export async function handlePhotoUploadWebhook(
  payload: PhotoUploadWebhookPayload
): Promise<void> {
  console.log('📸 Photo upload webhook received:', payload);

  try {
    if (payload.upload_status === 'success') {
      // Find pending submission without photo
      const { data: submission, error: findError } = await supabase
        .from('submissions')
        .select('id')
        .eq('se_id', payload.user_id)  // ✅ FIXED: Changed from user_id to se_id
        .is('photo_url', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (findError || !submission) {
        console.warn('No matching submission found for photo upload');
        return;
      }

      // Update submission with photo
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          photo_url: payload.file_url,
          photo_metadata: payload.metadata,
        })
        .eq('id', submission.id);

      if (updateError) {
        console.error('Failed to update submission with photo:', updateError);
        return;
      }

      console.log(`✅ Submission ${submission.id} updated with photo`);

      // Validate EXIF data if present
      if (payload.metadata?.exif) {
        await validatePhotoEXIF(submission.id, payload.metadata.exif);
      }
    } else {
      // Upload failed - log error
      await supabase.from('audit_logs').insert({
        action: 'PHOTO_UPLOAD_FAILED',
        table_name: 'submissions',
        metadata: {
          userId: payload.user_id,
          fileId: payload.file_id,
          error: 'Upload failed',
        },
      });
    }
  } catch (error) {
    console.error('Error handling photo upload webhook:', error);
    throw error;
  }
}

/**
 * Validate photo EXIF data
 * Checks GPS coordinates, timestamp, etc.
 */
async function validatePhotoEXIF(
  submissionId: string,
  exif: any
): Promise<void> {
  const validationResults = {
    hasGPS: !!exif.GPSLatitude && !!exif.GPSLongitude,
    hasTimestamp: !!exif.DateTimeOriginal,
    isFresh: false,
  };

  // Check if photo was taken recently (within 24 hours)
  if (exif.DateTimeOriginal) {
    const photoTime = new Date(exif.DateTimeOriginal);
    const now = new Date();
    const hoursDiff = (now.getTime() - photoTime.getTime()) / (1000 * 60 * 60);
    validationResults.isFresh = hoursDiff <= 24;
  }

  // Update submission with validation results
  await supabase
    .from('submissions')
    .update({
      exif_validation: validationResults,
    })
    .eq('id', submissionId);

  console.log(`📋 EXIF validation complete for submission ${submissionId}:`, validationResults);
}

// ============================================================================
// PAYMENT WEBHOOK (M-Pesa / Airtel Money)
// ============================================================================

/**
 * Handle payment completion webhook
 * For future reward payments to top performers
 */
export async function handlePaymentWebhook(payload: any): Promise<void> {
  console.log('💰 Payment webhook received:', payload);

  try {
    const { transaction_id, phone_number, amount, status, reference } = payload;

    // Log payment
    await supabase.from('audit_logs').insert({
      action: 'PAYMENT_RECEIVED',
      table_name: 'rewards',
      metadata: {
        transactionId: transaction_id,
        phone: phone_number,
        amount,
        status,
        reference,
      },
    });

    if (status === 'success') {
      // Find user by phone
      const { data: user, error } = await supabase
        .from('app_users')
        .select('id')
        .eq('phone_number', phone_number)
        .single();

      if (error || !user) {
        console.warn('User not found for payment:', phone_number);
        return;
      }

      // Record successful payment/reward
      // (You would need to create a rewards table)
      console.log(`✅ Payment successful for user ${user.id}: ${amount}`);
    }
  } catch (error) {
    console.error('Error handling payment webhook:', error);
    throw error;
  }
}

// ============================================================================
// PUSH NOTIFICATION DELIVERY WEBHOOK (Firebase / OneSignal)
// ============================================================================

/**
 * Handle push notification delivery status
 */
export async function handlePushNotificationWebhook(payload: any): Promise<void> {
  console.log('🔔 Push notification webhook received:', payload);

  try {
    const { notification_id, user_id, status, delivered_at } = payload;

    // Update notification delivery status
    await supabase.from('audit_logs').insert({
      action: 'PUSH_NOTIFICATION_STATUS',
      metadata: {
        notificationId: notification_id,
        userId: user_id,
        status,
        deliveredAt: delivered_at,
      },
    });

    console.log(`📬 Notification ${notification_id} ${status}`);
  } catch (error) {
    console.error('Error handling push notification webhook:', error);
    throw error;
  }
}

// ============================================================================
// EXTERNAL API WEBHOOKS
// ============================================================================

/**
 * Handle webhook from external API integration
 * Example: CRM system, ERP, etc.
 */
export async function handleExternalAPIWebhook(
  source: string,
  payload: any
): Promise<void> {
  console.log(`🔗 External API webhook from ${source}:`, payload);

  try {
    // Log webhook receipt
    await supabase.from('audit_logs').insert({
      action: 'EXTERNAL_WEBHOOK_RECEIVED',
      metadata: {
        source,
        payload,
        receivedAt: new Date().toISOString(),
      },
    });

    // Process based on source
    switch (source) {
      case 'crm':
        await handleCRMWebhook(payload);
        break;
      case 'erp':
        await handleERPWebhook(payload);
        break;
      default:
        console.warn(`Unknown webhook source: ${source}`);
    }
  } catch (error) {
    console.error('Error handling external API webhook:', error);
    throw error;
  }
}

async function handleCRMWebhook(payload: any): Promise<void> {
  // Process CRM data
  console.log('Processing CRM webhook:', payload);
}

async function handleERPWebhook(payload: any): Promise<void> {
  // Process ERP data
  console.log('Processing ERP webhook:', payload);
}

// ============================================================================
// DATABASE TRIGGER WEBHOOKS
// ============================================================================

/**
 * Webhook triggered by database changes
 * Example: Supabase webhook on submission approval
 */
export async function handleDatabaseTriggerWebhook(payload: any): Promise<void> {
  console.log('🗄️ Database trigger webhook:', payload);

  try {
    const { table, record, old_record, type } = payload;

    // Handle different table events
    if (table === 'submissions' && type === 'UPDATE') {
      // Check if status changed to approved
      if (
        old_record.status === 'pending' &&
        record.status === 'approved'
      ) {
        // Send congratulations notification to SE
        await sendApprovalNotification(record.se_id, record.points_awarded);  // ✅ FIXED: Changed from user_id to se_id
      }
    }

    if (table === 'user_achievements' && type === 'INSERT') {
      // Send achievement unlock notification
      await sendAchievementNotification(record.user_id, record.achievement_id);
    }
  } catch (error) {
    console.error('Error handling database trigger webhook:', error);
    throw error;
  }
}

async function sendApprovalNotification(
  userId: string,
  points: number
): Promise<void> {
  console.log(`📬 Sending approval notification to user ${userId}: +${points} points`);
  // Implement actual notification sending (SMS, Push, Email)
}

async function sendAchievementNotification(
  userId: string,
  achievementId: string
): Promise<void> {
  console.log(`🎉 Sending achievement notification to user ${userId}`);
  // Implement actual notification sending
}

// ============================================================================
// WEBHOOK REGISTRY
// ============================================================================

/**
 * Central webhook handler
 * Routes webhooks to appropriate handlers
 */
export async function handleWebhook(
  type: string,
  payload: any,
  signature?: string
): Promise<{ success: boolean; message: string }> {
  console.log(`📥 Webhook received: ${type}`);

  try {
    // Verify signature if provided
    if (signature) {
      const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      const isValid = await verifyWebhookSignature(
        JSON.stringify(payload),
        signature,
        webhookSecret
      );

      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }

    // Route to appropriate handler
    switch (type) {
      case 'sms':
        await handleSMSWebhook(payload);
        break;
      case 'photo_upload':
        await handlePhotoUploadWebhook(payload);
        break;
      case 'payment':
        await handlePaymentWebhook(payload);
        break;
      case 'push_notification':
        await handlePushNotificationWebhook(payload);
        break;
      case 'external_api':
        await handleExternalAPIWebhook(payload.source, payload.data);
        break;
      case 'database_trigger':
        await handleDatabaseTriggerWebhook(payload);
        break;
      default:
        console.warn(`Unknown webhook type: ${type}`);
        return {
          success: false,
          message: `Unknown webhook type: ${type}`,
        };
    }

    return {
      success: true,
      message: 'Webhook processed successfully',
    };
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return {
      success: false,
      message: error.message || 'Webhook processing failed',
    };
  }
}

// ============================================================================
// WEBHOOK RETRY LOGIC
// ============================================================================

/**
 * Retry failed webhook processing
 * Implements exponential backoff
 */
export async function retryWebhook(
  webhookId: string,
  maxRetries: number = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for webhook ${webhookId}`);

      // Fetch webhook details from database
      const { data: webhook, error } = await supabase
        .from('webhook_queue')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (error || !webhook) {
        console.error('Webhook not found:', webhookId);
        return;
      }

      // Process webhook
      const result = await handleWebhook(
        webhook.type,
        webhook.payload,
        webhook.signature
      );

      if (result.success) {
        // Mark as processed
        await supabase
          .from('webhook_queue')
          .update({ status: 'processed', processed_at: new Date().toISOString() })
          .eq('id', webhookId);

        console.log(`✅ Webhook ${webhookId} processed successfully`);
        return;
      }

      // Wait before retry (exponential backoff)
      const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error(`Retry attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        // Mark as failed after all retries
        await supabase
          .from('webhook_queue')
          .update({ status: 'failed', error: String(error) })
          .eq('id', webhookId);

        console.error(`❌ Webhook ${webhookId} failed after ${maxRetries} attempts`);
      }
    }
  }
}

// ============================================================================
// END OF WEBHOOK HANDLERS
// ============================================================================