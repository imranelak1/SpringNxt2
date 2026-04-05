'use client';

import { useState } from 'react';
import { analyzePdfImport, createProjectFromPdfImport } from '../../lib/api';
import type { PdfImportAnalysis, PdfImportEntity } from '../../lib/types';

type Step = 'upload' | 'validate' | 'done';

interface PdfImportProps {
  token: string;
}

const typeClass: Record<string, string> = {
  project: 'et-project',
  task: 'et-task',
  date: 'et-date',
  member: 'et-member',
};

const typeLabel: Record<string, string> = {
  project: 'Project',
  task: 'Task',
  date: 'Date',
  member: 'Member',
};

export default function PdfImport({ token }: PdfImportProps) {
  const [step, setStep] = useState<Step>('upload');
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [analysis, setAnalysis] = useState<PdfImportAnalysis | null>(null);
  const [entities, setEntities] = useState<PdfImportEntity[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [createdProject, setCreatedProject] = useState<{ name: string; taskCount: number } | null>(null);

  const handleAnalyzeFile = async (file: File) => {
    setFileName(file.name);
    setParsing(true);
    setError('');

    try {
      const response = await analyzePdfImport(token, file);
      setAnalysis(response);
      setEntities(response.entities);
      setStep('validate');
    } catch (analyzeError) {
      setError(analyzeError instanceof Error ? analyzeError.message : 'Unable to analyze PDF.');
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];

    if (file && file.type === 'application/pdf') {
      await handleAnalyzeFile(file);
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      await handleAnalyzeFile(file);
    }
  };

  const handleConfirm = async () => {
    const projectName =
      entities.find((entity) => entity.type === 'project')?.value || analysis?.projectName || 'Imported Project';
    const dates = entities.filter((entity) => entity.type === 'date');
    const tasks = entities
      .filter((entity) => entity.type === 'task')
      .map((entity) => entity.value)
      .filter(Boolean);

    setCreating(true);
    setError('');

    try {
      const result = await createProjectFromPdfImport(token, {
        projectName,
        description: analysis?.description ?? `Imported from PDF: ${fileName}`,
        startDate: dates[0]?.value || analysis?.startDate || null,
        endDate: dates[1]?.value || analysis?.endDate || null,
        tasks,
      });

      setCreatedProject({ name: result.projectName, taskCount: result.taskCount });
      setStep('done');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create project.');
    } finally {
      setCreating(false);
    }
  };

  if (step === 'done') {
    return (
      <div>
        <div className="section-title">PDF Import - Project Created</div>
        <div className="card">
          <div className="empty-state" style={{ padding: '70px 40px' }}>
            <div className="empty-ico">+</div>
            <p style={{ color: 'var(--accent)', fontSize: '16px', marginBottom: '8px' }}>
              Project created successfully
            </p>
            <p style={{ marginBottom: '20px' }}>
              {createdProject?.name} · {createdProject?.taskCount ?? 0} tasks generated
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-primary">Open projects</button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setStep('upload');
                  setAnalysis(null);
                  setEntities([]);
                  setCreatedProject(null);
                  setFileName('');
                }}
              >
                Import another PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ margin: 0 }}>
            PDF Import to Project
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Upload a requirements PDF and create a real project from the backend analysis
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: step !== 'upload' ? 'var(--accent)' : 'var(--text)' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, background: step !== 'upload' ? 'var(--accent)' : 'var(--surface2)', color: step !== 'upload' ? '#0a0c10' : 'var(--text)', border: '1px solid var(--border)' }}>1</div>
            Upload
          </div>
          <div style={{ width: '24px', height: '1px', background: 'var(--border)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: step === 'validate' ? 'var(--accent)' : 'var(--text-muted)' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, background: step === 'validate' ? 'var(--accent)' : 'var(--surface2)', color: step === 'validate' ? '#0a0c10' : 'inherit', border: '1px solid var(--border)' }}>2</div>
            Validate
          </div>
          <div style={{ width: '24px', height: '1px', background: 'var(--border)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, background: 'var(--surface2)', border: '1px solid var(--border)' }}>3</div>
            Create
          </div>
        </div>
      </div>

      {step === 'upload' ? (
        <div>
          {parsing ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '80px 40px' }}>
                <div style={{ fontSize: '36px', marginBottom: '18px', animation: 'fadeUp 0.5s infinite alternate' }}>[]</div>
                <div className="section-title" style={{ marginBottom: '8px' }}>Analyzing PDF...</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>{fileName}</div>
                <div style={{ width: '200px', height: '4px', background: 'var(--surface2)', borderRadius: '10px', overflow: 'hidden', margin: '0 auto' }}>
                  <div style={{ height: '100%', background: 'var(--accent)', borderRadius: '10px', width: '60%', animation: 'pulseWidth 1.5s ease-in-out infinite' }}></div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                  Uploading file and generating extracted entities...
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label>
                <div
                  className={`pdf-upload-zone ${dragging ? 'drag-over' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => void handleDrop(event)}
                >
                  <div className="pdf-upload-icon">[]</div>
                  <div className="pdf-upload-title">Drop your PDF requirements file here</div>
                  <div className="pdf-upload-sub" style={{ marginBottom: '18px' }}>
                    or click to choose a PDF from your computer
                  </div>
                  <span className="btn btn-ghost btn-sm">Browse files</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
                    Accepted format: PDF
                  </div>
                </div>
                <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={(event) => void handleFile(event)} />
              </label>

              <div className="ai-card" style={{ marginTop: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span className="ai-badge">API</span>
                  <span className="ai-title">What this backend import extracts</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <div className="ai-insight"><span className="insight-ico">1.</span><div className="insight-txt">Project name and description</div></div>
                  <div className="ai-insight"><span className="insight-ico">2.</span><div className="insight-txt">Suggested start and end dates</div></div>
                  <div className="ai-insight"><span className="insight-ico">3.</span><div className="insight-txt">Suggested delivery tasks</div></div>
                  <div className="ai-insight"><span className="insight-ico">4.</span><div className="insight-txt">A project-ready creation payload</div></div>
                </div>
              </div>
            </div>
          )}
          {error ? (
            <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--accent3)', background: 'rgba(255,107,107,0.08)', padding: '10px 12px', borderRadius: '8px' }}>
              {error}
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 'validate' && analysis ? (
        <div className="grid-lr">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontWeight: 600, fontSize: '14px' }}>
                  Extracted from: {analysis.fileName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {entities.length} items identified by the backend. Review and adjust if needed.
                </div>
              </div>
              <span className="badge b-green">Analyzed</span>
            </div>
            {entities.map((entity, index) => (
              <div key={index} className="extracted-entity">
                <span className={`entity-type ${typeClass[entity.type]}`}>{typeLabel[entity.type]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>{entity.label}</div>
                  {editIdx === index && entity.editable ? (
                    <input
                      className="form-input"
                      style={{ fontSize: '13px', padding: '5px 10px' }}
                      defaultValue={entity.value}
                      onBlur={(event) => {
                        setEntities((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, value: event.target.value } : item,
                          ),
                        );
                        setEditIdx(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <div
                      className="entity-value"
                      onClick={() => entity.editable && setEditIdx(index)}
                      style={{ cursor: entity.editable ? 'pointer' : 'default' }}
                    >
                      {entity.value}
                    </div>
                  )}
                  {entity.sub ? <div className="entity-sub">{entity.sub}</div> : null}
                </div>
                <button
                  className="action-btn action-btn-danger"
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                  onClick={() => setEntities((current) => current.filter((_, entityIndex) => entityIndex !== index))}
                >
                  x
                </button>
              </div>
            ))}
          </div>

          <div className="col-stack">
            <div className="card">
              <div className="card-header"><div className="card-title">Project summary</div></div>
              <div style={{ padding: '16px 18px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>Detected name</div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>
                    {entities.find((entity) => entity.type === 'project')?.value ?? analysis.projectName}
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>Estimated duration</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--accent4)' }}>
                    {(entities.find((entity) => entity.label === 'Start date')?.value ?? analysis.startDate) || 'TBD'} to {(entities.find((entity) => entity.label === 'End date')?.value ?? analysis.endDate) || 'TBD'}
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>Tasks ready to create</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--accent2)' }}>
                    {entities.filter((entity) => entity.type === 'task').length} tasks
                  </div>
                </div>
                <div className="pbar" style={{ height: '6px', marginBottom: '6px' }}>
                  <div className="pfill" style={{ width: '100%' }}></div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ready to create in backend</div>
              </div>
            </div>
            <div className="ai-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><span className="ai-badge">API</span><span className="ai-title">Import summary</span></div>
              <div className="ai-insight"><span className="insight-ico">1.</span><div className="insight-txt">File: <strong>{analysis.fileName}</strong></div></div>
              <div className="ai-insight"><span className="insight-ico">2.</span><div className="insight-txt">Tasks prepared: <strong>{entities.filter((entity) => entity.type === 'task').length}</strong></div></div>
              <div className="ai-insight"><span className="insight-ico">3.</span><div className="insight-txt">Project status on create: <strong>PLANNING</strong></div></div>
            </div>
            {error ? (
              <div style={{ fontSize: '12px', color: 'var(--accent3)', background: 'rgba(255,107,107,0.08)', padding: '10px 12px', borderRadius: '8px' }}>
                {error}
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-ghost" onClick={() => setStep('upload')}>Back</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => void handleConfirm()} disabled={creating}>
                {creating ? 'Creating...' : 'Create project'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
