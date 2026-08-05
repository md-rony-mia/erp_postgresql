import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  MapPin,
  Camera,
  QrCode,
  FileText,
  Trash2,
  Plus,
  Paperclip,
  Check,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Maximize2,
  Sliders,
  PenTool,
  Image as ImageIcon,
  CheckCircle,
  Hash,
  Smile,
  Copy,
  FolderPlus,
  X
} from 'lucide-react';

// ==========================================
// FORM FIELD AND ENGINE INTERFACES
// ==========================================
export type RichFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'time'
  | 'select'
  | 'boolean'
  | 'email'
  | 'phone'
  | 'richText'
  | 'image'
  | 'attachment'
  | 'barcode'
  | 'qr'
  | 'gps'
  | 'signature'
  | 'colorPicker'
  | 'jsonEditor'
  | 'repeatable'
  | 'nested';

export interface FieldDef {
  key: string;
  label: string;
  type: any; // Can be any of RichFieldType
  required?: boolean;
  unique?: boolean;
  options?: { label: string; value: string; color?: string }[];
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  
  // Advanced fields config
  dependsOn?: { field: string; value: any; operator?: 'equals' | 'contains' | 'notEquals' };
  formula?: string; // e.g. "qty * price" or "budget - cost"
  lookupTable?: string; // localStorage key to lookup from (e.g. "nexova_crud_suppliers")
  lookupField?: string; // field to pull (e.g. "name")
  autocompletePresets?: string[];
  
  // Nested/Repeatable
  subFields?: FieldDef[];
}

export interface FormLayoutGroup {
  id: string;
  title: string;
  icon?: string;
  fieldKeys: string[];
}

interface MetadataFormEngineProps {
  fields: FieldDef[];
  formData: Record<string, any>;
  setFormData: (newData: Record<string, any>) => void;
  formErrors: Record<string, string>;
  setFormErrors?: (errors: Record<string, string>) => void;
  viewOnly?: boolean;
  workflowStatuses?: string[];
  moduleKey?: string;
}

export default function MetadataFormEngine({
  fields,
  formData,
  setFormData,
  formErrors,
  setFormErrors,
  viewOnly = false,
  workflowStatuses = ['Draft', 'Pending Approval', 'Approved'],
  moduleKey = 'general'
}: MetadataFormEngineProps) {

  // --- LAYOUT ENGINE CONFIG STATE ---
  // The user can interactively toggle between layouts to preview the metadata engine in action!
  const [layoutMode, setLayoutMode] = useState<'sections' | 'tabs' | 'cards' | 'accordion' | 'wizard'>('sections');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeWizardStep, setActiveWizardStep] = useState<number>(0);
  const [accordionOpen, setAccordionOpen] = useState<Record<string, boolean>>({
    'primary_group': true,
    'secondary_group': false,
    'advanced_group': false
  });

  // --- ENHANCED CONTROL STATES ---
  const [barcodeScanOpen, setBarcodeScanOpen] = useState(false);
  const [activeBarcodeKey, setActiveBarcodeKey] = useState<string>('');
  const [qrScanOpen, setQrScanOpen] = useState(false);
  const [activeQrKey, setActiveQrKey] = useState<string>('');
  const [mapOpen, setMapOpen] = useState(false);
  const [activeMapKey, setActiveMapKey] = useState<string>('');
  
  // Custom mock map state
  const [markerCoords, setMarkerCoords] = useState({ lat: 23.8103, lng: 90.4125 }); // Default Dhaka coordinates
  
  // Signature Canvas Ref
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [activeSignatureKey, setActiveSignatureKey] = useState<string>('');

  // Auto-complete dropdown tracker
  const [activeAutocomplete, setActiveAutocomplete] = useState<{ key: string; index: number } | null>(null);

  // ==========================================
  // AUTO GENERATE GROUPS FROM FIELD METADATA
  // ==========================================
  const groups: FormLayoutGroup[] = useMemo(() => {
    // Dynamically split fields into sensible metadata groups
    const total = fields.length;
    const splitIndex1 = Math.ceil(total / 2);
    
    const primaryKeys = fields.slice(0, splitIndex1).map(f => f.key);
    const secondaryKeys = fields.slice(splitIndex1).map(f => f.key);

    return [
      { id: 'primary_group', title: 'Operational Primary Data', icon: 'Sparkles', fieldKeys: primaryKeys },
      { id: 'secondary_group', title: 'Workflow & Details Registry', icon: 'Sliders', fieldKeys: secondaryKeys }
    ];
  }, [fields]);

  // ==========================================
  // CONDITIONAL FIELDS RESOLVER
  // ==========================================
  const isFieldVisible = (field: FieldDef): boolean => {
    if (!field.dependsOn) return true;
    const { field: depField, value: depVal, operator = 'equals' } = field.dependsOn;
    const currentDepVal = formData[depField];

    if (operator === 'equals') {
      return String(currentDepVal) === String(depVal);
    }
    if (operator === 'contains') {
      return String(currentDepVal).toLowerCase().includes(String(depVal).toLowerCase());
    }
    if (operator === 'notEquals') {
      return String(currentDepVal) !== String(depVal);
    }
    return true;
  };

  // ==========================================
  // FORMULA FIELDS RUNTIME COMPUTATION
  // ==========================================
  useEffect(() => {
    let updated = false;
    const newFormData = { ...formData };

    fields.forEach((field) => {
      // 1. Check if it's a formula field
      if (field.formula) {
        let computedValue = 0;
        try {
          // Dynamic safe evaluate formula strings
          // support basic formulas like: "qty * price", "salary * 12", "budget - costEstimate"
          const tokens = field.formula.split(' ');
          if (tokens.length === 3) {
            const leftField = tokens[0];
            const op = tokens[1];
            const rightField = tokens[2];

            const leftVal = Number(formData[leftField] ?? 0);
            const rightVal = Number(formData[rightField] ?? 0);

            if (op === '*') computedValue = leftVal * rightVal;
            else if (op === '+') computedValue = leftVal + rightVal;
            else if (op === '-') computedValue = leftVal - rightVal;
            else if (op === '/') computedValue = rightVal !== 0 ? leftVal / rightVal : 0;
          }
        } catch (e) {
          // Intentionally silent: silent background evaluation of dynamic form formulas on user keystrokes
          console.error('Formula evaluation error', e);
        }

        if (newFormData[field.key] !== computedValue) {
          newFormData[field.key] = computedValue;
          updated = true;
        }
      }

      // 2. Check if it has a dynamic lookup
      if (field.lookupTable && !formData[field.key]) {
        try {
          const rawTable = localStorage.getItem(field.lookupTable);
          if (rawTable) {
            const parsed = JSON.parse(rawTable);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const lookupField = field.lookupField || 'name';
              // Set the default to the first lookup record's value
              newFormData[field.key] = parsed[0][lookupField];
              updated = true;
            }
          }
        } catch (e) {}
      }
    });

    if (updated) {
      setFormData(newFormData);
    }
  }, [formData, fields]);

  // ==========================================
  // SIGNATURE DRAWING CONTROLS
  // ==========================================
  const startDrawingSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1e1b4b'; // Indigo dark
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawingSignature(true);
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawingSignature = (key: string) => {
    setIsDrawingSignature(false);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    // Save image representation
    const dataUrl = canvas.toDataURL('image/png');
    setFormData({ ...formData, [key]: dataUrl });
  };

  const clearSignature = (key: string) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFormData({ ...formData, [key]: '' });
  };

  // ==========================================
  // MOCK ATTACHMENT DRAG AND DROP
  // ==========================================
  const handleAttachmentUpload = (key: string, name: string) => {
    const currentFiles = formData[key] || [];
    const newFile = {
      name,
      size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
      uploadedAt: new Date().toLocaleTimeString()
    };
    setFormData({ ...formData, [key]: [...currentFiles, newFile] });
  };

  const removeAttachment = (key: string, index: number) => {
    const currentFiles = formData[key] || [];
    const updated = currentFiles.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, [key]: updated });
  };

  // ==========================================
  // REPEATABLE SECTION CONTROLLERS
  // ==========================================
  const addRepeatableRow = (key: string, subFields: FieldDef[]) => {
    const currentRows = formData[key] || [];
    const newRow: Record<string, any> = {};
    subFields.forEach(sf => {
      newRow[sf.key] = sf.defaultValue !== undefined ? sf.defaultValue : '';
    });
    setFormData({ ...formData, [key]: [...currentRows, newRow] });
  };

  const removeRepeatableRow = (key: string, index: number) => {
    const currentRows = formData[key] || [];
    const updated = currentRows.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, [key]: updated });
  };

  const updateRepeatableRowValue = (key: string, rowIndex: number, fieldKey: string, value: any) => {
    const currentRows = formData[key] || [];
    const updated = currentRows.map((row: any, i: number) => {
      if (i === rowIndex) {
        return { ...row, [fieldKey]: value };
      }
      return row;
    });
    setFormData({ ...formData, [key]: updated });
  };

  // ==========================================
  // COMPONENT RENDER HELPER FOR FIELD TYPES
  // ==========================================
  const renderFieldInput = (field: FieldDef) => {
    const isRequired = !!field.required;
    const hasError = formErrors[field.key];
    const val = formData[field.key] ?? '';

    // If field is conditional and hidden, don't render it at all!
    if (!isFieldVisible(field)) return null;

    // View-Only Render Mode
    if (viewOnly) {
      return (
        <div className="bg-slate-50 border border-slate-100 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-700 min-h-[36px] flex items-center">
          {field.type === 'currency' ? (
            <span className="text-indigo-700 font-bold">৳{Number(val || 0).toLocaleString()} BDT</span>
          ) : field.type === 'colorPicker' ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: val }} />
              <span className="font-mono text-[10px]">{val || '#FFFFFF'}</span>
            </div>
          ) : field.type === 'signature' ? (
            val ? (
              <img src={val} alt="Authorized Signature" className="max-h-12 border border-slate-100 rounded bg-white p-1" />
            ) : (
              <span className="text-slate-400 italic">No Signature Captured</span>
            )
          ) : field.type === 'jsonEditor' ? (
            <pre className="text-[10px] font-mono text-indigo-900 bg-slate-100 p-2 rounded w-full overflow-x-auto">{JSON.stringify(val, null, 2)}</pre>
          ) : field.type === 'qr' || field.type === 'barcode' ? (
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-indigo-600" />
              <span className="font-mono font-bold tracking-wider">{val || '—'}</span>
            </div>
          ) : field.type === 'gps' ? (
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              <span>{val ? `LAT: ${val.lat}, LNG: ${val.lng}` : 'No Coordinates Captured'}</span>
            </div>
          ) : field.type === 'attachment' ? (
            <div className="space-y-1 w-full">
              {Array.isArray(val) && val.length > 0 ? (
                val.map((f: any, i: number) => (
                  <div key={`${f.name}_${i}`} className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold bg-indigo-50/50 px-2 py-1 rounded">
                    <Paperclip className="h-3 w-3" />
                    <span>{f.name} ({f.size})</span>
                  </div>
                ))
              ) : (
                <span className="text-slate-400 italic">No files attached</span>
              )}
            </div>
          ) : (
            String(val ?? '') || '—'
          )}
        </div>
      );
    }

    // Input renderer selector based on field.type meta
    switch (field.type as RichFieldType) {
      
      // 1. RICH MARKDOWN TEXT
      case 'richText':
        return (
          <div className="space-y-2">
            <textarea
              placeholder={field.placeholder || `Enter Markdown / Rich text description...`}
              value={val}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              className={`w-full bg-slate-50/50 text-xs text-slate-800 px-3.5 py-2.5 border rounded-lg focus:outline-none focus:bg-white focus:ring-1 transition-all font-mono leading-relaxed ${
                hasError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              rows={4}
            />
            {val && (
              <div className="bg-indigo-50/20 border border-indigo-100/60 rounded-lg p-3 text-xs leading-relaxed text-slate-600">
                <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Live Rich Text Preview
                </div>
                <div className="prose prose-slate max-w-none prose-xs font-medium">
                  {val.split('\n').map((para: string, idx: number) => (
                    // index key safe: fixed-order static list
                    <p key={idx} className="mb-1">{para}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      // 2. BRAND COLOR PICKER
      case 'colorPicker':
        const presetColors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#64748b'];
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={val || '#4f46e5'}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer p-0.5 bg-white shadow-xs shrink-0"
            />
            <div className="flex flex-wrap gap-1.5">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, [field.key]: color })}
                  className={`w-6 h-6 rounded-full border border-slate-200/60 shadow-xs transition-transform cursor-pointer hover:scale-110 flex items-center justify-center ${
                    val === color ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {val === color && <Check className="h-3 w-3 text-white drop-shadow-xs" />}
                </button>
              ))}
            </div>
            <span className="font-mono text-xs text-slate-500 font-bold uppercase">{val || '#4f46e5'}</span>
          </div>
        );

      // 3. ENTERPRISE ATTACHMENT PORT
      case 'attachment':
        const filesList = Array.isArray(val) ? val : [];
        return (
          <div className="border border-dashed border-slate-200 rounded-lg p-4 bg-slate-50/40 text-center space-y-3">
            <div className="flex flex-col items-center justify-center">
              <Paperclip className="h-6 w-6 text-slate-400 mb-1" />
              <div className="text-[11px] font-bold text-slate-600">Drag and drop enterprise contract files</div>
              <div className="text-[9px] text-slate-400 mt-0.5">PDF, Excel, images up to 10MB</div>
            </div>
            
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => handleAttachmentUpload(field.key, 'Invoice_Voucher_SLA.pdf')}
                className="bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 font-bold text-[9px] px-2.5 py-1.5 rounded-md cursor-pointer transition-colors"
              >
                + Add Invoice Mock.pdf
              </button>
              <button
                type="button"
                onClick={() => handleAttachmentUpload(field.key, 'Clearance_Certificate.png')}
                className="bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 font-bold text-[9px] px-2.5 py-1.5 rounded-md cursor-pointer transition-colors"
              >
                + Add Certificate Mock.png
              </button>
            </div>

            {filesList.length > 0 && (
              <div className="text-left border-t border-slate-100 pt-2.5 space-y-1.5">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Attached Files ({filesList.length})</div>
                <div className="space-y-1">
                  {filesList.map((f: any, idx: number) => (
                    <div key={`${f.name}_${idx}`} className="flex justify-between items-center bg-white border border-slate-150 px-2.5 py-1.5 rounded text-[10px] text-slate-600">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Paperclip className="h-3 w-3 text-indigo-500 shrink-0" />
                        <span>{f.name}</span>
                        <span className="text-slate-400 font-mono text-[9px]">({f.size})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(field.key, idx)}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      // 4. ENTERPRISE SIGNATURE CANVAS PAD
      case 'signature':
        return (
          <div className="space-y-2">
            <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shadow-inner">
              <canvas
                ref={(el) => {
                  signatureCanvasRef.current = el;
                  if (el && !activeSignatureKey) {
                    setActiveSignatureKey(field.key);
                  }
                }}
                width={400}
                height={120}
                onMouseDown={startDrawingSignature}
                onMouseMove={drawSignature}
                onMouseUp={() => stopDrawingSignature(field.key)}
                onMouseLeave={() => stopDrawingSignature(field.key)}
                className="w-full h-[120px] block cursor-crosshair bg-slate-100/50"
              />
              <div className="absolute right-2 top-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => clearSignature(field.key)}
                  className="bg-white/90 hover:bg-white text-slate-600 hover:text-indigo-700 font-bold text-[9px] px-2 py-1 rounded border border-slate-200 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Clear Pad
                </button>
              </div>
              <div className="absolute left-2 bottom-1.5 text-[9px] text-slate-400 font-medium">Draw signature securely with mouse/touch inside the frame</div>
            </div>
            {val && (
              <div className="flex items-center gap-3 bg-indigo-50/40 p-2 rounded-lg border border-indigo-100/60">
                <div className="text-[10px] font-bold text-indigo-600">Saved Vector:</div>
                <img src={val} alt="Authorized Preview" className="h-10 border border-white rounded shadow-xs bg-white p-0.5" />
              </div>
            )}
          </div>
        );

      // 5. SECURE BARCODE MODULE
      case 'barcode':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Barcode number (e.g. 880123456789)"
                  value={val}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full bg-slate-50/50 text-xs text-slate-800 pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setBarcodeScanOpen(true);
                  setActiveBarcodeKey(field.key);
                }}
                className="bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold text-slate-600 shadow-xs cursor-pointer"
              >
                <Camera className="h-4 w-4 text-indigo-600" />
                <span>Scan</span>
              </button>
            </div>
            
            {val && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 flex flex-col items-center justify-center space-y-1">
                {/* CSS Barcode Lines representation */}
                <div className="flex items-stretch h-8 gap-[1px]">
                  {String(val).split('').map((char, i) => {
                    const width = (Number(char) % 3) + 1;
                    return (
                      <div
                        // index key safe: fixed-order static list
                        key={i}
                        className="bg-slate-900"
                        style={{ width: `${width}px` }}
                      />
                    );
                  })}
                </div>
                <div className="font-mono text-[9px] text-slate-500 tracking-widest">{val}</div>
              </div>
            )}

            {/* Mock Viewfinder Modal */}
            {barcodeScanOpen && activeBarcodeKey === field.key && (
              <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
                  <div className="text-sm font-bold text-slate-800">Secure Barcode Viewfinder</div>
                  <div className="relative aspect-video bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
                    {/* Visual red laser scanner sweep */}
                    <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-lg animate-bounce" style={{ top: '50%' }} />
                    <Camera className="h-8 w-8 text-slate-700 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400">Position barcode inside camera scanning margins to register dataset code.</p>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const generatedCode = `8801${Math.floor(10000000 + Math.random() * 90000000)}`;
                        setFormData({ ...formData, [activeBarcodeKey]: generatedCode });
                        setBarcodeScanOpen(false);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                    >
                      Mock Successful Scan
                    </button>
                    <button
                      type="button"
                      onClick={() => setBarcodeScanOpen(false)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // 6. QR CODE DECODER & SCANNERS
      case 'qr':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <QrCode className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Insert secure redirect URL / identifier data"
                  value={val}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full bg-slate-50/50 text-xs text-slate-800 pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setQrScanOpen(true);
                  setActiveQrKey(field.key);
                }}
                className="bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold text-slate-600 shadow-xs cursor-pointer"
              >
                <Camera className="h-4 w-4 text-indigo-600" />
                <span>Scan</span>
              </button>
            </div>

            {val && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-150 flex flex-col items-center justify-center space-y-2">
                {/* Custom Grid styled simulation of high density QR code matrices */}
                <div className="grid grid-cols-10 gap-[1px] bg-white p-2 border border-slate-200 rounded shadow-xs w-28 h-28 shrink-0">
                  {Array.from({ length: 100 }).map((_, idx) => {
                    // Make corners always black for scanning target standard anchors
                    const isAnchor =
                      (idx < 3 && idx % 10 < 3) || // top left
                      (idx < 3 && idx % 10 >= 7) || // top right
                      (idx >= 70 && idx % 10 < 3); // bottom left
                    const isPixel = isAnchor || (Math.sin(idx * 7) > 0);
                    return (
                      <div
                        // index key safe: fixed-order static list
                        key={idx}
                        className={`rounded-xs ${isPixel ? 'bg-slate-900' : 'bg-white'}`}
                      />
                    );
                  })}
                </div>
                <div className="font-mono text-[9px] text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded font-bold break-all max-w-[200px] text-center">{val}</div>
              </div>
            )}

            {/* Mock QR Scan Viewfinder */}
            {qrScanOpen && activeQrKey === field.key && (
              <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
                  <div className="text-sm font-bold text-slate-800">QR Code Viewfinder Scanner</div>
                  <div className="relative aspect-square max-w-[220px] mx-auto bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-5 border-2 border-indigo-500 border-dashed rounded-md animate-pulse" />
                    <QrCode className="h-10 w-10 text-slate-700 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400">Position QR code clearly inside guidelines to execute decoders.</p>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, [activeQrKey]: 'https://nexova.erp.bd/verify/' + Math.floor(1000 + Math.random() * 9000) });
                        setQrScanOpen(false);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                    >
                      Scan Success Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrScanOpen(false)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // 7. HIGH CONSTAST MOCK MAP & GPS GEO-LOCATOR
      case 'gps':
        const latLng = val || { lat: 23.8103, lng: 90.4125 };
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-900">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  <span>LAT: {Number(latLng.lat).toFixed(5)}, LNG: {Number(latLng.lng).toFixed(5)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      window.alert('Geolocation is not supported by this browser.');
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setFormData({
                          ...formData,
                          [field.key]: { lat: pos.coords.latitude, lng: pos.coords.longitude }
                        });
                      },
                      (err) => {
                        window.alert(`Could not get location: ${err.message}`);
                      },
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  }}
                  className="bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px] px-2.5 py-1.5 rounded shadow-xs cursor-pointer transition-colors"
                >
                  Detect Real GPS
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMapOpen(true);
                  setActiveMapKey(field.key);
                  setMarkerCoords(latLng);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <MapPin className="h-4 w-4" />
                <span>Map Pin</span>
              </button>
            </div>

            {/* MOCK MAP EDITOR VIEWPORT MODAL */}
            {mapOpen && activeMapKey === field.key && (
              <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-rose-500" />
                      <span>Corporate GPS Geolocation Registry</span>
                    </h4>
                    <button type="button" onClick={() => setMapOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="relative aspect-video bg-indigo-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                    {/* Elegant custom high contrast representation of a map grid */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="absolute inset-x-0 h-px bg-slate-300" style={{ top: '40%' }} />
                    <div className="absolute inset-y-0 w-px bg-slate-300" style={{ left: '60%' }} />
                    <div className="absolute inset-x-0 h-px bg-indigo-200" style={{ top: '65%' }} />
                    
                    {/* Simulated city blocks */}
                    <div className="absolute left-[10%] top-[15%] w-16 h-12 bg-white border border-slate-200 rounded text-[8px] font-bold text-slate-400 p-1">Block A</div>
                    <div className="absolute left-[50%] top-[45%] w-20 h-10 bg-white border border-slate-200 rounded text-[8px] font-bold text-slate-400 p-1">Main Silo</div>
                    <div className="absolute left-[35%] top-[70%] w-24 h-12 bg-indigo-100/50 border border-indigo-200 rounded text-[8px] font-bold text-indigo-600 p-1 flex items-center justify-center">Siam Depot</div>

                    {/* Drag and drop interactive Pin */}
                    <div
                      className="absolute bg-rose-500 text-white rounded-full p-2 shadow-lg cursor-move animate-bounce"
                      style={{ top: '40%', left: '60%', transform: 'translate(-50%, -100%)' }}
                    >
                      <MapPin className="h-6 w-6" />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center">Interactive drag and drop pin synchronized with corporate logistics routes.</p>
                  
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px]">
                    <span className="font-bold text-slate-700">Latitude:</span>
                    <input
                      type="number"
                      step="0.00001"
                      value={markerCoords.lat}
                      onChange={(e) => setMarkerCoords({ ...markerCoords, lat: Number(e.target.value) })}
                      className="bg-white border border-slate-200 rounded px-2 py-0.5 w-24 text-right"
                    />
                    <span className="font-bold text-slate-700 ml-2">Longitude:</span>
                    <input
                      type="number"
                      step="0.00001"
                      value={markerCoords.lng}
                      onChange={(e) => setMarkerCoords({ ...markerCoords, lng: Number(e.target.value) })}
                      className="bg-white border border-slate-200 rounded px-2 py-0.5 w-24 text-right"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, [activeMapKey]: markerCoords });
                        setMapOpen(false);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Apply Location
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapOpen(false)}
                      className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // 8. RICH JSON EDITOR TEXTAREA WITH VALIDATION
      case 'jsonEditor':
        return (
          <div className="space-y-2">
            <textarea
              placeholder={`{\n  "customField": "value"\n}`}
              value={typeof val === 'object' ? JSON.stringify(val, null, 2) : val}
              onChange={(e) => {
                const text = e.target.value;
                setFormData({ ...formData, [field.key]: text });
                
                // Validate JSON syntax in real-time
                if (setFormErrors) {
                  try {
                    if (text.trim() === '') {
                      const errs = { ...formErrors };
                      delete errs[field.key];
                      setFormErrors(errs);
                    } else {
                      JSON.parse(text);
                      const errs = { ...formErrors };
                      delete errs[field.key];
                      setFormErrors(errs);
                    }
                  } catch (err) {
                    setFormErrors({ ...formErrors, [field.key]: 'Invalid JSON format syntax.' });
                  }
                }
              }}
              className={`w-full bg-slate-900 text-emerald-400 font-mono text-[10px] p-3 border rounded-lg focus:outline-none focus:ring-1 transition-all leading-relaxed ${
                hasError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-800 focus:ring-indigo-500'
              }`}
              rows={4}
            />
            <div className="text-[9px] text-slate-400 font-medium">Inputs are strictly monitored for compliance with standard JSON schemas.</div>
          </div>
        );

      // 9. DYNAMIC LOOKUP INPUTS WITH AUTOCOMPLETE SUGGESTIONS
      case 'text':
      case 'textarea':
      case 'select':
      default:
        // Check if there is autocomplete presets
        if (field.autocompletePresets && field.autocompletePresets.length > 0) {
          return (
            <div className="relative">
              <input
                type="text"
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                value={val}
                onFocus={() => setActiveAutocomplete({ key: field.key, index: -1 })}
                onBlur={() => setTimeout(() => setActiveAutocomplete(null), 200)}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                className={`w-full bg-slate-50/50 text-xs text-slate-800 px-3.5 py-2 border rounded-lg focus:outline-none focus:bg-white focus:ring-1 transition-all ${
                  hasError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {activeAutocomplete && activeAutocomplete.key === field.key && (
                <div className="absolute w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 animate-in fade-in duration-100">
                  {field.autocompletePresets
                    .filter((preset) => String(preset).toLowerCase().includes(String(val).toLowerCase()))
                    .map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData({ ...formData, [field.key]: preset })}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 font-semibold text-slate-700"
                      >
                        {preset}
                      </button>
                    ))}
                </div>
              )}
            </div>
          );
        }

        // Standard Textarea
        if (field.type === 'textarea') {
          return (
            <textarea
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
              value={val}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              className={`w-full bg-slate-50/50 text-xs text-slate-800 px-3.5 py-2 border rounded-lg focus:outline-none focus:bg-white focus:ring-1 transition-all ${
                hasError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              rows={3}
            />
          );
        }

        // Standard select dropdown
        if (field.type === 'select') {
          return (
            <select
              value={val}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              className={`w-full bg-slate-50/50 text-xs text-slate-800 px-3.5 py-2 border rounded-lg focus:outline-none focus:bg-white focus:ring-1 transition-all font-semibold ${
                hasError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            >
              <option value="">-- Select option --</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          );
        }

        // Default: general input matching standard HTML forms
        return (
          <input
            type={
              field.type === 'number' || field.type === 'currency'
                ? 'number'
                : field.type === 'date'
                ? 'date'
                : field.type === 'time'
                ? 'time'
                : field.type === 'email'
                ? 'email'
                : field.type === 'phone'
                ? 'tel'
                : 'text'
            }
            disabled={!!field.formula} // Formula fields are calculated and locked!
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            value={val}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
            className={`w-full text-xs text-slate-800 px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-all ${
              field.formula ? 'bg-slate-100 font-bold text-indigo-700 cursor-not-allowed' : 'bg-slate-50/50 focus:bg-white'
            } ${
              hasError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          />
        );
    }
  };

  // ==========================================
  // CORE LAYOUT CHASSIS GENERATOR
  // ==========================================
  return (
    <div className="space-y-5">
      
      {/* Dynamic Form Control configuration panel (No Code Settings Controller) */}
      {!viewOnly && (
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 px-2">
            <Sliders className="h-4 w-4 text-indigo-600" />
            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-widest">Metadata Form Layout Configurator</span>
          </div>
          <div className="flex gap-1">
            {(['sections', 'tabs', 'cards', 'accordion', 'wizard'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setLayoutMode(mode)}
                className={`text-[9px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  layoutMode === mode
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RENDER CHASSIS 1: ACCORDION VIEWPORT */}
      {layoutMode === 'accordion' && (
        <div className="space-y-2">
          {groups.map((group, groupIdx) => {
            const isOpen = !!accordionOpen[group.id];
            return (
              <div key={group.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setAccordionOpen({ ...accordionOpen, [group.id]: !isOpen })}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100/60 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-white border border-slate-200 rounded text-indigo-600 shrink-0">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{group.title}</span>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </button>
                {isOpen && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-150">
                    {fields
                      .filter((f) => group.fieldKeys.includes(f.key))
                      .map((field) => (
                        <div key={field.key} className={field.type === 'textarea' || field.type === 'richText' || field.type === 'repeatable' ? 'col-span-1 sm:col-span-2' : ''}>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            <span>{field.label}</span>
                            {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                          </label>
                          {renderFieldInput(field)}
                          {formErrors[field.key] && (
                            <p className="text-rose-500 text-[9px] font-bold mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>{formErrors[field.key]}</span>
                            </p>
                          )}
                          {field.helpText && !formErrors[field.key] && (
                            <p className="text-slate-400 text-[9px] mt-0.5">{field.helpText}</p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RENDER CHASSIS 2: TABS VIEWPORT */}
      {layoutMode === 'tabs' && (
        <div className="space-y-4">
          <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
            {groups.map((group, idx) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === idx
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {group.title}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields
              .filter((f) => groups[activeTab]?.fieldKeys.includes(f.key))
              .map((field) => (
                <div key={field.key} className={field.type === 'textarea' || field.type === 'richText' ? 'col-span-1 sm:col-span-2' : ''}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <span>{field.label}</span>
                    {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                  </label>
                  {renderFieldInput(field)}
                  {formErrors[field.key] && (
                    <p className="text-rose-500 text-[9px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{formErrors[field.key]}</span>
                    </p>
                  )}
                  {field.helpText && !formErrors[field.key] && (
                    <p className="text-slate-400 text-[9px] mt-0.5">{field.helpText}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* RENDER CHASSIS 3: WIZARD MULTI-STEPS VIEWPORT */}
      {layoutMode === 'wizard' && (
        <div className="space-y-4">
          {/* Step circles tracking banner */}
          <div className="flex items-center justify-between px-6 bg-white border border-slate-200 rounded-xl py-3.5 shadow-xs">
            {groups.map((group, idx) => (
              <div key={group.id} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    activeWizardStep === idx
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-100'
                      : activeWizardStep > idx
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:inline ${
                  activeWizardStep === idx ? 'text-indigo-600' : 'text-slate-400'
                }`}>{group.title}</span>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[220px]">
            {fields
              .filter((f) => groups[activeWizardStep]?.fieldKeys.includes(f.key))
              .map((field) => (
                <div key={field.key} className={field.type === 'textarea' || field.type === 'richText' ? 'col-span-1 sm:col-span-2' : ''}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <span>{field.label}</span>
                    {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                  </label>
                  {renderFieldInput(field)}
                  {formErrors[field.key] && (
                    <p className="text-rose-500 text-[9px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{formErrors[field.key]}</span>
                    </p>
                  )}
                  {field.helpText && !formErrors[field.key] && (
                    <p className="text-slate-400 text-[9px] mt-0.5">{field.helpText}</p>
                  )}
                </div>
              ))}
          </div>

          <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-3">
            <button
              type="button"
              disabled={activeWizardStep === 0}
              onClick={() => setActiveWizardStep(activeWizardStep - 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider rounded-lg disabled:opacity-50 cursor-pointer"
            >
              Back Step
            </button>
            <button
              type="button"
              disabled={activeWizardStep === groups.length - 1}
              onClick={() => setActiveWizardStep(activeWizardStep + 1)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg disabled:opacity-50 cursor-pointer"
            >
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* RENDER CHASSIS 4: CARDS (GRID BLOCKS CONTAINER) */}
      {layoutMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">{group.title}</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {fields
                  .filter((f) => group.fieldKeys.includes(f.key))
                  .map((field) => (
                    <div key={field.key}>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        <span>{field.label}</span>
                        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                      </label>
                      {renderFieldInput(field)}
                      {formErrors[field.key] && (
                        <p className="text-rose-500 text-[9px] font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{formErrors[field.key]}</span>
                        </p>
                      )}
                      {field.helpText && !formErrors[field.key] && (
                        <p className="text-slate-400 text-[9px] mt-0.5">{field.helpText}</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RENDER CHASSIS 5: STANDARD COLLAPSIBLE SECTIONS VIEWPORT (Sensible default for existing systems!) */}
      {layoutMode === 'sections' && (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
              <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-6 w-6 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">{group.title}</h4>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields
                  .filter((f) => group.fieldKeys.includes(f.key))
                  .map((field) => (
                    <div key={field.key} className={field.type === 'textarea' || field.type === 'richText' || field.type === 'repeatable' ? 'col-span-1 sm:col-span-2' : ''}>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        <span>{field.label}</span>
                        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                      </label>
                      {renderFieldInput(field)}
                      {formErrors[field.key] && (
                        <p className="text-rose-500 text-[9px] font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{formErrors[field.key]}</span>
                        </p>
                      )}
                      {field.helpText && !formErrors[field.key] && (
                        <p className="text-slate-400 text-[9px] mt-0.5">{field.helpText}</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Repeatable Sections - item array block */}
      {fields.some(f => f.type === 'repeatable') && (
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
              <FolderPlus className="h-4 w-4 text-indigo-600" />
              <span>Modular Repeatable Items Block</span>
            </span>
            {!viewOnly && (
              <button
                type="button"
                onClick={() => {
                  const repField = fields.find(f => f.type === 'repeatable');
                  if (repField && repField.subFields) {
                    addRepeatableRow(repField.key, repField.subFields);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] px-2.5 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="h-3 w-3" /> Add Item Row
              </button>
            )}
          </div>

          {fields.filter(f => f.type === 'repeatable').map((field) => {
            const rows = formData[field.key] || [];
            return (
              <div key={field.key} className="space-y-3">
                {rows.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-50/50 rounded-lg border border-slate-150">No repeatable data items logged.</p>
                ) : (
                  <div className="space-y-2">
                    {rows.map((row: any, rowIndex: number) => (
                      <div key={rowIndex} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-in slide-in-from-top-1.5 duration-100">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">{rowIndex + 1}</div>
                        
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                          {field.subFields?.map((sf) => (
                            <div key={sf.key}>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{sf.label}</label>
                              {viewOnly ? (
                                <div className="text-xs text-slate-700 font-semibold">{row[sf.key] || '—'}</div>
                              ) : (
                                <input
                                  type={sf.type === 'number' ? 'number' : 'text'}
                                  value={row[sf.key] ?? ''}
                                  onChange={(e) => updateRepeatableRowValue(field.key, rowIndex, sf.key, e.target.value)}
                                  placeholder={sf.placeholder || `Enter ${sf.label.toLowerCase()}...`}
                                  className="w-full bg-slate-50 text-xs text-slate-800 px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                                />
                              )}
                            </div>
                          ))}
                        </div>

                        {!viewOnly && (
                          <button
                            type="button"
                            onClick={() => removeRepeatableRow(field.key, rowIndex)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg p-2 cursor-pointer transition-colors shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
