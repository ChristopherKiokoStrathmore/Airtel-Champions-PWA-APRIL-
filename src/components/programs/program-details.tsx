import { X, Send, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';

interface ProgramDetailsProps {
  program: any;
  onClose: () => void;
  onSubmit?: () => void;
  userRole?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProgramDetails({ program, onClose, onSubmit, userRole, onEdit, onDelete }: ProgramDetailsProps) {
  const fields = program.fields || [];
  
  // Check if program is expired
  const isExpired = program.end_date && new Date(program.end_date) < new Date();
  
  // Check if user can submit (SE, ZSM, ZBM can submit, and program must not be expired)
  const canSubmit = userRole && ['sales_executive', 'zonal_sales_manager', 'zonal_business_manager'].includes(userRole) && !isExpired;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-white mb-1">{program.title}</h2>
            <p className="text-white text-opacity-90 text-sm">Program Details & Questions</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white bg-opacity-20 rounded-xl hover:bg-opacity-30 transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Program Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Description</h3>
              <p className="text-gray-900">{program.description || 'No description provided'}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm text-gray-500 mb-1">Points Value</h3>
                <p className="text-2xl text-red-600">
                  {program.points_value > 0 ? program.points_value : 'No Points'}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500 mb-1">Status</h3>
                <span
                  className={`inline-block px-4 py-1 rounded-full text-sm ${
                    program.status === 'active'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {program.status}
                </span>
              </div>
              <div>
                <h3 className="text-sm text-gray-500 mb-1">Created</h3>
                <p className="text-gray-900">
                  {new Date(program.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm text-gray-500 mb-2">Target Roles</h3>
              <div className="flex gap-2 flex-wrap">
                {program.target_roles.map((role: string) => (
                  <span
                    key={role}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm"
                  >
                    {role === 'sales_executive' ? 'Sales Executives' :
                     role === 'zonal_sales_manager' ? 'Zonal Sales Manager' :
                     role === 'zonal_business_manager' ? 'Zonal Business Manager' :
                     role === 'hq_staff' || role === 'hq_command_center' ? 'HQ Staff' :
                     role === 'director' ? 'Director' : role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Questions/Fields */}
          <div>
            <h3 className="text-xl text-gray-900 mb-4">Questions ({fields.length})</h3>
            
            {fields.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-400">No questions configured for this program</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field: any, index: number) => (
                  <div
                    key={field.id || index}
                    className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded-full text-sm">
                            {index + 1}
                          </span>
                          <h4 className="text-lg text-gray-900">
                            {field.field_label || field.label || field.question || field.field_name || 'Untitled Question'}
                          </h4>
                        </div>
                        {(field.help_text || field.description) && (
                          <p className="text-sm text-gray-500 ml-11">{field.help_text || field.description}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-white border border-gray-300 text-gray-600 rounded-lg text-xs">
                        {field.field_type || field.type}
                      </span>
                    </div>

                    {/* Show options for multiple choice fields */}
                    {(field.field_type === 'multiple_choice' || field.field_type === 'dropdown' || field.field_type === 'radio' || 
                      field.type === 'multiple_choice' || field.type === 'dropdown' || field.type === 'radio') && 
                     (field.options?.options || field.options) && (
                      <div className="ml-11 mt-3">
                        <p className="text-xs text-gray-500 mb-2">Options:</p>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(field.options) ? field.options : field.options?.options || []).map((option: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show validation info */}
                    <div className="ml-11 mt-3 flex items-center gap-4 text-xs text-gray-500">
                      {(field.is_required || field.required) && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Required
                        </span>
                      )}
                      {field.validation?.min && (
                        <span>Min: {field.validation.min}</span>
                      )}
                      {field.validation?.max && (
                        <span>Max: {field.validation.max}</span>
                      )}
                      {field.validation?.maxLength && (
                        <span>Max Length: {field.validation.maxLength}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
          >
            Close
          </button>
          <div className="flex items-center gap-3">
            {onSubmit && canSubmit && (
              <button
                onClick={onSubmit}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Send className="w-5 h-5" />
                Submit Response
              </button>
            )}
            {onSubmit && isExpired && (
              <div className="px-6 py-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl font-semibold flex items-center gap-2">
                <span>⏰</span>
                Program Expired
              </div>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold flex items-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Edit Program
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete Program
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}