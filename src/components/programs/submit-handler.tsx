/**
 * Extracted handleSubmit logic for ProgramSubmitModal
 * Handles validation, duplicate checking, photo conversion, and DB submission
 */
import { getSupabaseClient } from '../../utils/supabase/client';
import { trackAction, ANALYTICS_ACTIONS } from '../../utils/analytics';

interface SubmitParams {
  program: any;
  userId: string;
  fields: any[];
  formData: Record<string, any>;
  photos: Record<string, File[]>;
  location: { lat: number; lng: number } | null;
  shopName: string;
  submissionDate: string;
  submissionTime: string;
  linkedMSISDNs?: Array<{ id: string; msisdn: string; site_name?: string; ga_done: string; fromCheckIn: boolean }>;
  linkedCheckInData?: any;
  morningOdometer?: number | null;
  inlineOdometer?: number | null;
}

interface SubmitCallbacks {
  setSubmitting: (v: boolean) => void;
  setError: (v: string) => void;
  setValidationErrors: (v: Record<string, any>) => void;
  onSuccess: (pointsAwarded: number, newTotal: number, submissionDetails?: SubmissionDetails) => void;
}

export interface SubmissionDetails {
  submissionId: string;
  programTitle: string;
  programId: string;
  formData: Record<string, any>;
  fields: any[];
  shopName: string;
  submissionDate: string;
  submissionTime: string;
  location: { lat: number; lng: number } | null;
  photosCount: number;
  linkedMSISDNs?: any[];
  linkedCheckInData?: any;
  morningOdometer?: number | null;
  eveningOdometer?: number | null;
  distanceCovered?: number | null;
  pointsAwarded: number;
  userName?: string;
}

export async function handleFormSubmit(params: SubmitParams, callbacks: SubmitCallbacks) {
  const { program, userId, fields, formData, photos, location, shopName, submissionDate, submissionTime, linkedMSISDNs, linkedCheckInData, morningOdometer, inlineOdometer } = params;
  const { setSubmitting, setError, setValidationErrors, onSuccess } = callbacks;

  try {
    setSubmitting(true);
    setError('');

    // Validate required fields
    const validationErrors: Record<string, any> = {};

    for (const field of fields) {
      if (field.is_required) {
        if (field.field_type === 'photo' || field.field_type === 'photo_upload') {
          if (!photos[field.id] || photos[field.id].length === 0) {
            validationErrors[field.id] = true;
          }
        } else if (field.field_type === 'repeatable_number') {
          const entries = formData[field.id];
          const minEntries = field.options?.min_entries || 1;
          const digitLength = field.options?.digit_length;
          const preventDuplicates = field.options?.prevent_duplicates;

          if (!entries || !Array.isArray(entries) || entries.length < minEntries) {
            validationErrors[field.id] = true;
          } else {
            const hasEmptyEntries = entries.some((entry: any) => entry === '' || entry === null || entry === undefined);
            if (hasEmptyEntries) {
              validationErrors[field.id] = true;
            } else if (digitLength) {
              const invalidEntries = entries.filter((entry: any) => entry.toString().length !== digitLength);
              if (invalidEntries.length > 0) {
                validationErrors[field.id] = true;
              } else if (preventDuplicates) {
                const uniqueValues = new Set(entries.map((e: any) => e.toString()));
                if (uniqueValues.size < entries.length) {
                  validationErrors[field.id] = true;
                  validationErrors[`${field.id}_duplicate`] = true;
                }
              }
            } else if (preventDuplicates) {
              const uniqueValues = new Set(entries.map((e: any) => e.toString()));
              if (uniqueValues.size < entries.length) {
                validationErrors[field.id] = true;
                validationErrors[`${field.id}_duplicate`] = true;
              }
            }
          }
        } else {
          const value = formData[field.id];
          if (value === '' || value === null || value === undefined) {
            validationErrors[field.id] = true;
          }
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors(validationErrors);
      setError('❌ Please fill in all required fields (marked with *)');
      setSubmitting(false);
      return;
    }

    // Check database for same-day duplicates if configured
    // 🛡️ Anti-Fraud: Search ALL submissions today, then only block if number was found
    // in the SAME program. Numbers submitted under OTHER programs are allowed.
    for (const field of fields) {
      if (field.field_type === 'repeatable_number' && field.options?.check_database) {
        const entries = formData[field.id];
        if (entries && Array.isArray(entries) && entries.length > 0) {
          const today = new Date();
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
          const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

          try {
            const supabase = getSupabaseClient();
            // Search ALL submissions today (across all programs) to find the number
            const { data: todaySubmissions, error: dbError } = await supabase
              .from('submissions')
              .select('responses, program_id')
              .gte('created_at', startOfDay.toISOString())
              .lte('created_at', endOfDay.toISOString());

            if (dbError) throw new Error(`Failed to check for duplicate entries: ${dbError.message}`);

            // Build a set of values that were submitted under THIS SAME program only
            const sameProgValues = new Set<string>();
            const entryStrings = new Set(entries.map((e: any) => e.toString()));

            todaySubmissions?.forEach((submission: any) => {
              const responses = submission.responses;
              if (!responses || typeof responses !== 'object') return;

              // Search ALL response values (not just a specific field.id key)
              // This catches numbers stored under any field name/UUID
              for (const [key, value] of Object.entries(responses)) {
                // Skip internal metadata fields
                if (key.startsWith('_')) continue;

                // Check array values (repeatable_number fields)
                if (Array.isArray(value)) {
                  value.forEach((v: any) => {
                    const vStr = v?.toString();
                    if (vStr && entryStrings.has(vStr)) {
                      // Number found — check which program it belongs to
                      if (submission.program_id === program.id) {
                        // Same program → this is a duplicate, block it
                        sameProgValues.add(vStr);
                      }
                      // Different program → allowed, do nothing
                      console.log(`[AntiFraud] Number ${vStr} found in program ${submission.program_id} (current: ${program.id}) → ${submission.program_id === program.id ? 'BLOCKED (same program)' : 'ALLOWED (different program)'}`);
                    }
                  });
                } else if (value !== null && value !== undefined) {
                  // Check single values too (text/number fields that might contain MSISDNs)
                  const vStr = value.toString();
                  if (entryStrings.has(vStr)) {
                    if (submission.program_id === program.id) {
                      sameProgValues.add(vStr);
                    }
                    console.log(`[AntiFraud] Number ${vStr} found in program ${submission.program_id} (current: ${program.id}) → ${submission.program_id === program.id ? 'BLOCKED (same program)' : 'ALLOWED (different program)'}`);
                  }
                }
              }
            });

            const duplicateEntries = entries.filter((entry: any) => sameProgValues.has(entry.toString()));
            if (duplicateEntries.length > 0) {
              validationErrors[field.id] = true;
              validationErrors[`${field.id}_database_duplicate`] = duplicateEntries;
              setValidationErrors(validationErrors);
              setError(`❌ The following ${field.options.entry_label || 'number'}(s) were already submitted today in this program: ${duplicateEntries.join(', ')}`);
              setSubmitting(false);
              return;
            }
          } catch (err: any) {
            setError(`❌ ${err.message}`);
            setSubmitting(false);
            return;
          }
        }
      }
    }

    // Combine all photos from all fields
    const allPhotos: File[] = [];
    Object.values(photos).forEach(fieldPhotos => allPhotos.push(...fieldPhotos));

    // Convert photos to base64
    const photoData = [];
    for (const photo of allPhotos) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(photo);
      });
      photoData.push({ name: photo.name, type: photo.type, size: photo.size, data: base64, timestamp: new Date().toISOString() });
    }

    // Write directly to Supabase database
    const supabase = getSupabaseClient();
    const pointsToAward = (program.points_enabled !== false) ? (program.points_value ?? 10) : 0;

    const { data: submission, error: dbError } = await supabase
      .from('submissions')
      .insert({
        program_id: program.id,
        user_id: userId,
        responses: {
          ...formData,
          _shop_name: shopName,
          _submission_date: submissionDate,
          _submission_time: submissionTime,
          // 🔗 Include linked checkout MSISDN data if present
          ...(linkedMSISDNs && linkedMSISDNs.length > 0 ? {
            _linked_checkout: true,
            _linked_checkin_program_id: program.linked_checkin_program_id || null,
            _linked_msisdns: linkedMSISDNs.map(m => ({
              msisdn: m.msisdn,
              ga_done: parseInt(m.ga_done) || 0,
              site_name: m.site_name || '',
              from_checkin: m.fromCheckIn,
            })),
            _linked_total_gas: linkedMSISDNs.reduce((sum, m) => sum + (parseInt(m.ga_done) || 0), 0),
            _linked_promoter_count: linkedMSISDNs.length,
            _linked_checkin_session_id: linkedCheckInData?.checkin_session_id || null,
          } : {}),
          // 🏎️ Include odometer data for checkout forms
          ...(morningOdometer !== null && morningOdometer !== undefined ? (() => {
            // Find the current odometer reading from formData (if an odometer form field exists)
            const odoField = fields.find((f: any) => {
              const name = (f.field_name || '').toLowerCase();
              const label = (f.field_label || '').toLowerCase();
              return (name.includes('odometer') || label.includes('odometer')) && f.field_type === 'number';
            });
            const odoFromField = odoField ? Number(formData[odoField.id]) || null : null;
            // Use form field value first, fall back to inline odometer (from tracker card input)
            const currentOdo = odoFromField ?? inlineOdometer ?? null;
            const distance = currentOdo !== null ? currentOdo - morningOdometer : null;
            return {
              _morning_odometer: morningOdometer,
              _evening_odometer: currentOdo,
              _distance_covered: distance !== null && distance >= 0 ? distance : null,
            };
          })() : {}),
        },
        photos: photoData.map(p => p.data),
        gps_location: location ? { lat: location.lat, lng: location.lng } : null,
        status: 'submitted',
        points_awarded: pointsToAward,
      })
      .select()
      .single();

    if (dbError) throw new Error(dbError.message || 'Failed to save submission to database');

    // Calculate odometer details for the report
    const odoField = fields.find((f: any) => {
      const name = (f.field_name || '').toLowerCase();
      const label = (f.field_label || '').toLowerCase();
      return (name.includes('odometer') || label.includes('odometer')) && f.field_type === 'number';
    });
    const odoFromField = odoField ? Number(formData[odoField.id]) || null : null;
    const reportEveningOdo = odoFromField ?? inlineOdometer ?? null;
    const reportDistance = (reportEveningOdo !== null && morningOdometer !== null && morningOdometer !== undefined)
      ? reportEveningOdo - morningOdometer
      : null;

    // Get user name for the report
    const storedUserData = localStorage.getItem('tai_user');
    const reportUserName = storedUserData ? JSON.parse(storedUserData)?.name || '' : '';

    // Build submission details for the report
    const buildDetails = (pts: number): SubmissionDetails => ({
      submissionId: submission.id,
      programTitle: program.title,
      programId: program.id,
      formData,
      fields,
      shopName,
      submissionDate,
      submissionTime,
      location,
      photosCount: allPhotos.length,
      linkedMSISDNs,
      linkedCheckInData,
      morningOdometer: morningOdometer ?? null,
      eveningOdometer: reportEveningOdo,
      distanceCovered: reportDistance !== null && reportDistance >= 0 ? reportDistance : null,
      pointsAwarded: pts,
      userName: reportUserName,
    });

    if (pointsToAward > 0) {
      const { data: currentUser } = await supabase
        .from('app_users')
        .select('total_points')
        .eq('id', userId)
        .single();

      const newTotal = (currentUser?.total_points || 0) + pointsToAward;

      await supabase
        .from('app_users')
        .update({ total_points: newTotal })
        .eq('id', userId);

      const storedUser = localStorage.getItem('tai_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.total_points = newTotal;
        localStorage.setItem('tai_user', JSON.stringify(user));
      }

      await trackAction(ANALYTICS_ACTIONS.SUBMIT_PROGRAM, {
        program_id: program.id, program_title: program.title,
        points_awarded: pointsToAward, photos_count: allPhotos.length,
        has_gps: !!location, submission_id: submission.id,
      });

      onSuccess(pointsToAward, newTotal, buildDetails(pointsToAward));
    } else {
      const { data: currentUser } = await supabase
        .from('app_users')
        .select('total_points')
        .eq('id', userId)
        .single();

      await trackAction(ANALYTICS_ACTIONS.SUBMIT_PROGRAM, {
        program_id: program.id, program_title: program.title,
        points_awarded: 0, photos_count: allPhotos.length,
        has_gps: !!location, submission_id: submission.id,
      });

      onSuccess(0, currentUser?.total_points || 0, buildDetails(0));
    }
  } catch (err: any) {
    console.error('[Submit] Error:', err);
    setError(err.message || 'Submission failed');
  } finally {
    setSubmitting(false);
  }
}