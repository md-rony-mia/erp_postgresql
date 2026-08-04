import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { FieldDefinition, TabDefinition, SectionDefinition } from '../types';
import { MetadataEngine } from '../engine';
import { getFieldPermission } from '../permissions';
import { getLayoutStructure } from '../layouts';

interface DynamicFormRendererProps {
  fields: FieldDefinition[];
  tabs: TabDefinition[];
  sections: SectionDefinition[];
  formData: Record<string, any>;
  onChange: (updated: Record<string, any>) => void;
  errors: Record<string, string>;
  userRole?: string;
  categoriesList?: string[];
  warehousesList?: string[];
  unitsList?: string[];
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  fields,
  tabs,
  sections,
  formData,
  onChange,
  errors,
  userRole = 'Administrator',
  categoriesList = [],
  warehousesList = [],
  unitsList = [],
}) => {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id || 'general');

  // Helper to render Lucide Icons dynamically
  const renderIcon = (iconName: string, className: string = 'w-4 h-4') => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return <LucideIcons.FileText className={className} />;
  };

  // Build Layout structure grouped by Tab -> Section
  const { grouped } = getLayoutStructure(fields, tabs, sections);

  // Recalculate formulas and dependencies when data changes
  const handleFieldChange = (key: string, value: any) => {
    const updated = { ...formData, [key]: value };

    // 1. Evaluate Dependencies & Formulas for all fields in sequence
    fields.forEach((field) => {
      // Evaluate Formula
      if (field.fieldType === 'Formula' && field.formula) {
        const formulaResult = MetadataEngine.evaluateFormula(field.formula, updated);
        updated[field.fieldKey] = Number(formulaResult).toFixed(2);
      }
    });

    onChange(updated);
  };

  // Run initial formulas on mount to populate read-only computed metrics
  useEffect(() => {
    const initial = { ...formData };
    let changed = false;
    fields.forEach((field) => {
      if (field.fieldType === 'Formula' && field.formula) {
        const formulaResult = MetadataEngine.evaluateFormula(field.formula, initial);
        const valStr = Number(formulaResult).toFixed(2);
        if (initial[field.fieldKey] !== valStr) {
          initial[field.fieldKey] = valStr;
          changed = true;
        }
      }
    });
    if (changed) {
      onChange(initial);
    }
  }, [fields]);

  // Determine width classes based on field metadata properties
  const getWidthClass = (width: string) => {
    switch (width) {
      case 'Full':
        return 'col-span-12';
      case 'Half':
        return 'col-span-12 md:col-span-6';
      case 'Third':
        return 'col-span-12 md:col-span-4';
      case 'Quarter':
        return 'col-span-12 md:col-span-3';
      default:
        return 'col-span-12 md:col-span-6';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[500px]">
      {/* Dynamic Tab Sidebar List */}
      <div className="lg:w-60 shrink-0 border-r border-slate-100 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const fieldsInTab = fields.filter((f) => f.tab === tab.id);
          const visibleCount = fieldsInTab.filter((f) => {
            const perm = getFieldPermission(f, userRole);
            const dep = MetadataEngine.evaluateDependencies(f, formData);
            return perm !== 'None' && !dep.hidden;
          }).length;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-indigo-50/80 text-indigo-700 border-l-2 border-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className={isActive ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}>
                {renderIcon(tab.icon || 'FileText', 'w-4 h-4')}
              </span>
              <span className="flex-1 truncate">{tab.title}</span>
              {visibleCount > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {visibleCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Content / Sections View */}
      <div className="flex-1 space-y-8 min-w-0">
        {tabs.map((tab) => {
          if (activeTab !== tab.id) return null;
          const tabData = grouped[tab.id];
          if (!tabData) return null;

          // Filter sections with at least one visible field
          const activeSections = tabData.sections.filter((sec) => {
            const secFields = sec.fields.filter((f) => {
              const perm = getFieldPermission(f, userRole);
              const dep = MetadataEngine.evaluateDependencies(f, formData);
              return perm !== 'None' && !dep.hidden;
            });
            return secFields.length > 0;
          });

          if (activeSections.length === 0) {
            return (
              <div key={tab.id} className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <LucideIcons.Lock className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Access Locked</p>
                <p className="text-[11px] text-slate-400 mt-1">No fields are accessible for role: {userRole}</p>
              </div>
            );
          }

          return (
            <div key={tab.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {activeSections.map(({ section, fields: secFields }) => (
                <div key={section.id} className="border border-slate-100 rounded-xl bg-white shadow-xs p-5 space-y-4">
                  {/* Section Title Heading */}
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <span className="text-indigo-600 font-bold">{renderIcon(section.icon || 'Folder', 'w-4 h-4')}</span>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-display">
                      {section.title}
                    </h4>
                  </div>

                  {/* Responsive grid of Fields */}
                  <div className="grid grid-cols-12 gap-5">
                    {secFields.map((field) => {
                      // 1. Compute dynamic field states (Hidden, Read-Only, Required)
                      const permission = getFieldPermission(field, userRole);
                      const depState = MetadataEngine.evaluateDependencies(field, formData);

                      if (permission === 'None' || depState.hidden) {
                        return null;
                      }

                      const isReadonly = permission === 'View' || depState.readonly || field.readonly;
                      const isRequired = depState.required || field.required;
                      const hasError = errors[field.fieldKey];
                      const fieldValue = formData[field.fieldKey] ?? '';

                      return (
                        <div key={field.id} className={getWidthClass(field.width)}>
                          <div className="flex items-center justify-between mb-1">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              {field.displayName}
                              {isRequired && <span className="text-rose-500 font-bold">*</span>}
                              {isReadonly && <LucideIcons.Lock className="w-2.5 h-2.5 text-slate-300" />}
                            </label>
                            {field.tooltip && (
                              <div className="group relative">
                                <LucideIcons.HelpCircle className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 cursor-help" />
                                <span className="absolute bottom-full right-0 mb-1 w-48 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg z-20">
                                  {field.tooltip}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Render actual Input type */}
                          <div className="relative">
                            {/* TEXT / RICH TEXT / STRING INPUT */}
                            {(field.fieldType === 'Text' || field.fieldType === 'Rich Text') && (
                              <div className="relative flex items-center">
                                <LucideIcons.FileText className="absolute left-3 text-slate-400 w-4 h-4" />
                                <input
                                  type="text"
                                  disabled={isReadonly}
                                  placeholder={field.placeholder || `Enter ${field.displayName.toLowerCase()}`}
                                  value={fieldValue}
                                  onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                                  className={`w-full bg-slate-50/70 border rounded-lg p-2.5 pl-10 text-xs focus:outline-none transition-colors ${
                                    isReadonly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:border-indigo-600 focus:bg-white'
                                  } ${hasError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}
                                />
                              </div>
                            )}

                            {/* TEXTAREA */}
                            {field.fieldType === 'Textarea' && (
                              <textarea
                                disabled={isReadonly}
                                placeholder={field.placeholder}
                                value={fieldValue}
                                onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                                rows={3}
                                className={`w-full bg-slate-50/70 border rounded-lg p-2.5 text-xs focus:outline-none transition-colors ${
                                  isReadonly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:border-indigo-600 focus:bg-white'
                                } ${hasError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}
                              />
                            )}

                            {/* INTEGER / DECIMAL / CURRENCY / PERCENTAGE */}
                            {((field.fieldType as string) === 'Integer' ||
                              (field.fieldType as string) === 'Decimal' ||
                              (field.fieldType as string) === 'Currency' ||
                              (field.fieldType as string) === 'Percentage' ||
                              (field.fieldType as string) === 'Number') && (
                              <div className="relative flex items-center">
                                {field.fieldType === 'Currency' ? (
                                  <span className="absolute left-3 text-slate-400 text-xs font-bold">৳</span>
                                ) : (
                                  <LucideIcons.Hash className="absolute left-3 text-slate-400 w-4 h-4" />
                                )}
                                <input
                                  type="number"
                                  disabled={isReadonly}
                                  placeholder={field.placeholder || '0'}
                                  step={field.fieldType === 'Integer' ? '1' : '0.01'}
                                  value={fieldValue}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : Number(e.target.value);
                                    handleFieldChange(field.fieldKey, val);
                                  }}
                                  className={`w-full bg-slate-50/70 border rounded-lg p-2.5 pl-10 text-xs focus:outline-none transition-colors ${
                                    isReadonly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:border-indigo-600 focus:bg-white'
                                  } ${hasError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}
                                />
                                {field.fieldType === 'Percentage' && (
                                  <span className="absolute right-3 text-slate-400 text-xs font-bold">%</span>
                                )}
                              </div>
                            )}

                            {/* CHECKBOX */}
                            {field.fieldType === 'Checkbox' && (
                              <div className="flex items-center h-10">
                                <input
                                  type="checkbox"
                                  id={`chk_${field.id}`}
                                  disabled={isReadonly}
                                  checked={!!fieldValue}
                                  onChange={(e) => handleFieldChange(field.fieldKey, e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                                />
                                <label htmlFor={`chk_${field.id}`} className="ml-2 text-xs text-slate-600 font-semibold cursor-pointer select-none">
                                  {fieldValue ? 'Checked / Yes' : 'Unchecked / No'}
                                </label>
                              </div>
                            )}

                            {/* BOOLEAN / TOGGLE */}
                            {(field.fieldType === 'Boolean' || field.fieldType === 'Toggle') && (
                              <div className="flex items-center h-10">
                                <button
                                  type="button"
                                  disabled={isReadonly}
                                  onClick={() => handleFieldChange(field.fieldKey, !fieldValue)}
                                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    fieldValue ? 'bg-indigo-600' : 'bg-slate-200'
                                  } ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                      fieldValue ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                                <span className="ml-3 text-xs text-slate-600 font-medium select-none">
                                  {fieldValue ? 'Active / Enabled' : 'Inactive / Disabled'}
                                </span>
                              </div>
                            )}

                            {/* DATE / DATE-TIME / TIME */}
                            {(field.fieldType === 'Date' ||
                              field.fieldType === 'DateTime' ||
                              field.fieldType === 'Time') && (
                              <div className="relative flex items-center">
                                <LucideIcons.Calendar className="absolute left-3 text-slate-400 w-4 h-4" />
                                <input
                                  type={
                                    field.fieldType === 'Date'
                                      ? 'date'
                                      : field.fieldType === 'DateTime'
                                      ? 'datetime-local'
                                      : 'time'
                                  }
                                  disabled={isReadonly}
                                  value={fieldValue}
                                  onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                                  className={`w-full bg-slate-50/70 border rounded-lg p-2.5 pl-10 text-xs focus:outline-none transition-colors ${
                                    isReadonly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:border-indigo-600 focus:bg-white'
                                  } ${hasError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}
                                />
                              </div>
                            )}

                            {/* EMAIL INPUT */}
                            {(field.fieldType as string) === 'Email' && (
                              <div className="relative flex items-center">
                                <LucideIcons.Mail className="absolute left-3 text-slate-400 w-4 h-4" />
                                <input
                                  type="email"
                                  disabled={isReadonly}
                                  placeholder={field.placeholder || 'operator@enterprise.com'}
                                  value={fieldValue}
                                  onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                                  className={`w-full bg-slate-50/70 border rounded-lg p-2.5 pl-10 text-xs focus:outline-none transition-colors ${
                                    isReadonly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:border-indigo-600 focus:bg-white'
                                  } ${hasError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}
                                />
                              </div>
                            )}

                            {/* PHONE INPUT */}
                            {(field.fieldType as string) === 'Phone' && (
                              <div className="relative flex items-center">
                                <LucideIcons.Phone className="absolute left-3 text-slate-400 w-4 h-4" />
                                <input
                                  type="tel"
                                  disabled={isReadonly}
                                  placeholder={field.placeholder || '+880-1XXXX-XXXXXX'}
                                  value={fieldValue}
                                  onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                                  className={`w-full bg-slate-50/70 border rounded-lg p-2.5 pl-10 text-xs focus:outline-none transition-colors ${
                                    isReadonly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:border-indigo-600 focus:bg-white'
                                  } ${hasError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}
                                />
                              </div>
                            )}

                            {/* URL INPUT */}
                            {(field.fieldType as string) === 'URL' && (
                              <div className="relative flex items-center">
                                <LucideIcons.Globe className="absolute left-3 text-slate-400 w-4 h-4" />
                                <input
                                  type="url"
                                  disabled={isReadonly}
                                  placeholder={field.placeholder || 'https://example.com'}
                                  value={fieldValue}
                                  onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                                  className={`w-full bg-slate-50/70 border rounded-lg p-2.5 pl-10 pr-12 text-xs focus:outline-none transition-colors ${
                                    isReadonly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:border-indigo-600 focus:bg-white'
                                  } ${hasError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}
                                />
                                {fieldValue && (
                                  <a
                                    href={fieldValue}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute right-2 px-1.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-bold text-indigo-600 flex items-center gap-0.5"
                                  >
                                    <span>Visit</span>
                                    <LucideIcons.ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            )}

                            {/* DROPDOWN / SELECT */}
                            {field.fieldType === 'Dropdown' && (
                              <div className="relative flex items-center">
                                <LucideIcons.ChevronDown className="absolute right-3 text-slate-400 w-4 h-4 pointer-events-none" />
                                <select
                                  disabled={isReadonly}
                                  value={fieldValue}
                                  onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                                  className={`w-full bg-slate-50/70 border rounded-lg p-2.5 pr-10 text-xs focus:outline-none transition-colors cursor-pointer appearance-none ${
                                    isReadonly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:border-indigo-600 focus:bg-white'
                                  } ${hasError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}
                                >
                                  <option value="">Select Option</option>
                                  {/* Inject Custom List dropdown values mapping from metadata or lists context */}
                                  {field.fieldKey === 'category'
                                    ? categoriesList.map((cat) => (
                                        <option key={cat} value={cat}>
                                          {cat}
                                        </option>
                                      ))
                                    : field.options
                                    ? field.options.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))
                                    : null}
                                </select>
                              </div>
                            )}

                            {/* RADIO BUTTONS */}
                            {field.fieldType === 'Radio' && (
                              <div className="flex flex-wrap gap-4 py-2">
                                {(field.options || [{ label: 'Option 1', value: 'Option 1' }, { label: 'Option 2', value: 'Option 2' }]).map((opt) => (
                                  <label key={opt.value} className="flex items-center text-xs font-semibold text-slate-600 cursor-pointer">
                                    <input
                                      type="radio"
                                      disabled={isReadonly}
                                      name={`radio_${field.fieldKey}`}
                                      value={opt.value}
                                      checked={String(fieldValue) === String(opt.value)}
                                      onChange={() => handleFieldChange(field.fieldKey, opt.value)}
                                      className="h-3.5 w-3.5 border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-1.5 cursor-pointer disabled:opacity-50"
                                    />
                                    <span>{opt.label}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* MULTI SELECT */}
                            {((field.fieldType as string) === 'Multi Select' || (field.fieldType as string) === 'Multi-select') && (
                              <div className="space-y-2 border border-slate-100 rounded-lg p-2.5 bg-slate-50/40">
                                <div className="flex flex-wrap gap-1.5">
                                  {((Array.isArray(fieldValue) ? fieldValue : String(fieldValue).split(',').filter(Boolean))).map((val: string) => (
                                    <span key={val} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-indigo-100">
                                      {val}
                                      {!isReadonly && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const arr = Array.isArray(fieldValue) ? fieldValue : String(fieldValue).split(',').filter(Boolean);
                                            const updated = arr.filter((v: string) => v !== val);
                                            handleFieldChange(field.fieldKey, updated.join(','));
                                          }}
                                          className="hover:text-indigo-900 font-bold focus:outline-none"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </span>
                                  ))}
                                  {(!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)) && (
                                    <span className="text-[10px] text-slate-400 italic">None selected</span>
                                  )}
                                </div>
                                {!isReadonly && (
                                  <div className="flex flex-wrap gap-2 pt-1.5 border-t border-slate-100">
                                    {(field.options || [{ label: 'Option A', value: 'Option A' }, { label: 'Option B', value: 'Option B' }]).map((opt) => {
                                      const arr = Array.isArray(fieldValue) ? fieldValue : String(fieldValue).split(',').filter(Boolean);
                                      const isSel = arr.includes(opt.value);
                                      return (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          onClick={() => {
                                            let updated;
                                            if (isSel) {
                                              updated = arr.filter((v: string) => v !== opt.value);
                                            } else {
                                              updated = [...arr, opt.value];
                                            }
                                            handleFieldChange(field.fieldKey, updated.join(','));
                                          }}
                                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer font-semibold ${
                                            isSel
                                              ? 'bg-indigo-600 text-white border-indigo-600'
                                              : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* WAREHOUSE SELECT LOOKUP */}
                            {(field.fieldType === 'Warehouse' || field.fieldType === 'Supplier' || field.fieldType === 'Customer' || field.fieldType === 'Employee' || field.fieldType === 'User' || field.fieldType === 'Lookup') && (
                              <div className="relative flex items-center">
                                <LucideIcons.Search className="absolute left-3 text-slate-400 w-4 h-4 pointer-events-none" />
                                <LucideIcons.ChevronDown className="absolute right-3 text-slate-400 w-4 h-4 pointer-events-none" />
                                <select
                                  disabled={isReadonly}
                                  value={fieldValue}
                                  onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                                  className={`w-full bg-slate-50/70 border rounded-lg p-2.5 pl-10 pr-10 text-xs focus:outline-none transition-colors cursor-pointer appearance-none ${
                                    isReadonly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:border-indigo-600 focus:bg-white'
                                  } ${hasError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}
                                >
                                  <option value="">Select {field.fieldType || 'Lookup Reference'}</option>
                                  {field.options && field.options.length > 0 ? (
                                    field.options.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))
                                  ) : field.fieldType === 'Warehouse' ? (
                                    warehousesList.map((wh) => (
                                      <option key={wh} value={wh}>
                                        {wh}
                                      </option>
                                    ))
                                  ) : field.fieldType === 'Supplier' ? (
                                    <>
                                      <option value="Siam Cement Group">Siam Cement Group</option>
                                      <option value="BSRM Steel Corp">BSRM Steel Corp</option>
                                      <option value="Standard Supplier Ltd">Standard Supplier Ltd</option>
                                    </>
                                  ) : field.fieldType === 'Customer' ? (
                                    <>
                                      <option value="Ananta Apparels Ltd">Ananta Apparels Ltd</option>
                                      <option value="Bashundhara Group">Bashundhara Group</option>
                                      <option value="Sikder Builders">Sikder Builders</option>
                                    </>
                                  ) : field.fieldType === 'Employee' || field.fieldType === 'User' ? (
                                    <>
                                      <option value="M. Rahman (Admin)">M. Rahman (Admin)</option>
                                      <option value="S. Ahmed (Manager)">S. Ahmed (Manager)</option>
                                      <option value="T. Khan (Operator)">T. Khan (Operator)</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="Ref-A">Default Lookup A</option>
                                      <option value="Ref-B">Default Lookup B</option>
                                    </>
                                  )}
                                </select>
                              </div>
                            )}

                            {/* RELATIONS / PRODUCT RELATION */}
                            {((field.fieldType as string) === 'Relations' || field.fieldType === 'Product Relation') && (
                              <div className="relative flex items-center">
                                <LucideIcons.Layers className="absolute left-3 text-slate-400 w-4 h-4 pointer-events-none" />
                                <LucideIcons.ChevronDown className="absolute right-3 text-slate-400 w-4 h-4 pointer-events-none" />
                                <select
                                  disabled={isReadonly}
                                  value={fieldValue}
                                  onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                                  className={`w-full bg-slate-50/70 border rounded-lg p-2.5 pl-10 pr-10 text-xs focus:outline-none transition-colors cursor-pointer appearance-none ${
                                    isReadonly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:border-indigo-600 focus:bg-white'
                                  } ${hasError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}
                                >
                                  <option value="">Select Connected Product</option>
                                  {(() => {
                                    try {
                                      const prodsRaw = localStorage.getItem('nexova_products');
                                      if (prodsRaw) {
                                        const parsed = JSON.parse(prodsRaw);
                                        if (Array.isArray(parsed)) {
                                          return parsed.map((p: any) => (
                                            <option key={p.id} value={p.sku}>
                                              {p.name} ({p.sku})
                                            </option>
                                          ));
                                        }
                                      }
                                    } catch (e) {}
                                    return (
                                      <>
                                        <option value="CEM-PC-001">Portland Composite Cement (CEM-PC-001)</option>
                                        <option value="STL-REB-500">BSRM Deformed Bar 500W (STL-REB-500)</option>
                                        <option value="SND-SYL-001">Sylhet Coarse Sand (SND-SYL-001)</option>
                                      </>
                                    );
                                  })()}
                                </select>
                              </div>
                            )}

                            {/* FORMULA (READ-ONLY) */}
                            {field.fieldType === 'Formula' && (
                              <div className="flex items-center bg-slate-100/80 border border-slate-200 rounded-lg px-3 py-2.5">
                                <LucideIcons.Cpu className="w-3.5 h-3.5 text-indigo-600 mr-2 animate-pulse" />
                                <span className="text-xs font-mono font-bold text-slate-700">{fieldValue || '0.00'}</span>
                                <span className="ml-auto text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded font-mono font-bold uppercase">Computed Formula</span>
                              </div>
                            )}

                            {/* BARCODE / QR SCANNER PREVIEW GIZMO */}
                            {(field.fieldType === 'Barcode' || field.fieldType === 'QR Code') && (
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  disabled={isReadonly}
                                  placeholder={field.placeholder || `Scan ${field.fieldType}`}
                                  value={fieldValue}
                                  onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                                  className={`w-full bg-slate-50/70 border rounded-lg p-2.5 pr-10 text-xs focus:outline-none transition-colors ${
                                    isReadonly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:border-indigo-600 focus:bg-white'
                                  } ${hasError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}
                                />
                                <div className="absolute right-3 text-indigo-500">
                                  {field.fieldType === 'Barcode' ? (
                                    <LucideIcons.Barcode className="w-4 h-4" />
                                  ) : (
                                    <LucideIcons.QrCode className="w-4 h-4" />
                                  )}
                                </div>
                              </div>
                            )}

                            {/* SINGLE IMAGE / IMAGE UPLOAD */}
                            {(field.fieldType === 'Image' || (field.fieldType as string) === 'Image Upload') && (
                              <div className="border border-slate-200/80 rounded-lg p-3 bg-slate-50/40 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-16 rounded-md bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                    {fieldValue ? (
                                      <img src={fieldValue} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <LucideIcons.Image className="w-6 h-6 text-slate-300" />
                                    )}
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <input
                                      type="text"
                                      disabled={isReadonly}
                                      placeholder="Paste Image Asset URL..."
                                      value={fieldValue}
                                      onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-[11px] focus:outline-none font-mono"
                                    />
                                    {!isReadonly && (
                                      <button
                                        type="button"
                                        onClick={() => handleFieldChange(field.fieldKey, 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=200&auto=format&fit=crop')}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                                      >
                                        💡 Load Sample Product Image
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* GALLERY / MULTIPLE IMAGES */}
                            {(field.fieldType === 'Gallery' || (field.fieldType as string) === 'Multiple Images') && (
                              <div className="border border-slate-200/80 rounded-lg p-3 bg-slate-50/40 space-y-3">
                                <div className="grid grid-cols-4 gap-2">
                                  {String(fieldValue).split(',').filter(Boolean).map((url, i) => (
                                    <div key={i} className="relative aspect-square rounded border border-slate-200 bg-white overflow-hidden group">
                                      <img src={url} alt="Gallery" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      {!isReadonly && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const urls = String(fieldValue).split(',').filter(Boolean);
                                            urls.splice(i, 1);
                                            handleFieldChange(field.fieldKey, urls.join(','));
                                          }}
                                          className="absolute inset-0 bg-black/65 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                                        >
                                          ✕ Remove
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {!isReadonly && (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="Paste image URL and press Enter..."
                                      className="flex-1 bg-white border border-slate-200 rounded p-1.5 text-[11px] focus:outline-none font-mono"
                                      onKeyDown={(e) => {
                                        const target = e.target as HTMLInputElement;
                                        if (e.key === 'Enter' && target.value.trim()) {
                                          e.preventDefault();
                                          const current = String(fieldValue).split(',').filter(Boolean);
                                          handleFieldChange(field.fieldKey, [...current, target.value.trim()].join(','));
                                          target.value = '';
                                        }
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* FILE UPLOAD */}
                            {(field.fieldType === 'File' || (field.fieldType as string) === 'File Upload') && (
                              <div className="border border-slate-200/80 rounded-lg p-3 bg-slate-50/40 space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
                                      <LucideIcons.File className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                      <p className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]">
                                        {fieldValue ? String(fieldValue).split('/').pop() : 'No file linked'}
                                      </p>
                                    </div>
                                  </div>
                                  {fieldValue && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <a
                                        href={fieldValue}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 hover:bg-slate-200 text-slate-600 rounded"
                                        title="Open Document"
                                      >
                                        <LucideIcons.Download className="w-3.5 h-3.5" />
                                      </a>
                                      {!isReadonly && (
                                        <button
                                          type="button"
                                          onClick={() => handleFieldChange(field.fieldKey, '')}
                                          className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                                          title="Remove File"
                                        >
                                          <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {!isReadonly && (
                                  <input
                                    type="text"
                                    placeholder="Paste document URL (e.g. Google Drive share link)..."
                                    value={fieldValue || ''}
                                    onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-[11px] focus:outline-none font-mono"
                                  />
                                )}
                              </div>
                            )}

                            {/* PDF UPLOAD */}
                            {(field.fieldType === 'PDF' || (field.fieldType as string) === 'PDF Upload') && (
                              <div className="border border-slate-200/80 rounded-lg p-3 bg-slate-50/40 space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="p-2 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 shrink-0">
                                      <LucideIcons.FileText className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                      <p className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]">
                                        {fieldValue ? String(fieldValue).split('/').pop() : 'No PDF linked'}
                                      </p>
                                    </div>
                                  </div>
                                  {fieldValue && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <a
                                        href={fieldValue}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-[10px] font-bold text-indigo-700 rounded border border-indigo-100 flex items-center gap-0.5"
                                      >
                                        <span>View</span>
                                        <LucideIcons.ExternalLink className="w-3 h-3" />
                                      </a>
                                      {!isReadonly && (
                                        <button
                                          type="button"
                                          onClick={() => handleFieldChange(field.fieldKey, '')}
                                          className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                                          title="Remove Document"
                                        >
                                          <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {!isReadonly && (
                                  <input
                                    type="text"
                                    placeholder="Paste PDF URL (e.g. Google Drive share link)..."
                                    value={fieldValue || ''}
                                    onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-[11px] focus:outline-none font-mono"
                                  />
                                )}
                              </div>
                            )}

                          </div>

                          {/* Help Text / Error messages */}
                          {hasError ? (
                            <p className="mt-1 text-[10px] text-rose-500 font-medium flex items-center gap-1 animate-pulse">
                              <LucideIcons.AlertTriangle className="w-2.5 h-2.5" />
                              {hasError}
                            </p>
                          ) : field.helpText ? (
                            <p className="mt-1 text-[10px] text-slate-400 font-medium">
                              {field.helpText}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
