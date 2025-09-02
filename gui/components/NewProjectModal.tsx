/**
 * New Project Modal Component
 * Wizard for creating new projects with template selection
 */

import React, { useState } from 'react';
import { PROJECT_TEMPLATES, type ProjectTemplate, type ProjectCreationConfig } from '../../core/templates.ts';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (config: ProjectCreationConfig) => Promise<void>;
}

type WizardStep = 'template' | 'config' | 'creating';

export function NewProjectModal({ isOpen, onClose, onCreateProject }: NewProjectModalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [config, setConfig] = useState<Partial<ProjectCreationConfig>>({
    category: 'personal'
  });

  if (!isOpen) return null;

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setConfig(prev => ({ ...prev, template: template.id }));
    setCurrentStep('config');
  };

  const handleCreateProject = async () => {
    if (!selectedTemplate || !config.name) return;

    const fullConfig: ProjectCreationConfig = {
      name: config.name,
      category: config.category || 'personal',
      template: selectedTemplate.id,
      domain: config.domain,
      subdomain: config.subdomain,
      description: config.description || `A new ${selectedTemplate.name} project`
    };

    setIsCreating(true);
    setCurrentStep('creating');
    
    try {
      await onCreateProject(fullConfig);
      handleClose();
    } catch (error) {
      console.error('Failed to create project:', error);
      setIsCreating(false);
      setCurrentStep('config');
    }
  };

  const handleClose = () => {
    setCurrentStep('template');
    setSelectedTemplate(null);
    setConfig({ category: 'personal' });
    setIsCreating(false);
    onClose();
  };

  const handleBack = () => {
    if (currentStep === 'config') {
      setCurrentStep('template');
      setSelectedTemplate(null);
    }
  };

  const renderTemplateSelection = () => (
    <div className="wizard-step">
      <h3>Choose a Project Template</h3>
      <p>Select a template to get started with your new project</p>
      
      <div className="template-categories">
        {['frontend', 'backend', 'fullstack', 'static'].map(category => (
          <div key={category} className="template-category">
            <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
            <div className="template-grid">
              {PROJECT_TEMPLATES
                .filter(template => template.category === category)
                .map(template => (
                  <button
                    key={template.id}
                    className="template-card"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="template-icon">{template.icon}</div>
                    <div className="template-info">
                      <h5>{template.name}</h5>
                      <p>{template.description}</p>
                      <div className="template-technologies">
                        {template.technologies.map(tech => (
                          <span key={tech} className="tech-tag">{tech}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProjectConfig = () => (
    <div className="wizard-step">
      <div className="step-header">
        <button className="back-button" onClick={handleBack}>
          ← Back
        </button>
        <h3>Configure Your Project</h3>
      </div>
      
      <div className="selected-template-summary">
        <div className="template-icon">{selectedTemplate?.icon}</div>
        <div>
          <h4>{selectedTemplate?.name}</h4>
          <p>{selectedTemplate?.description}</p>
        </div>
      </div>

      <form className="project-config-form">
        <div className="form-group">
          <label htmlFor="project-name">Project Name *</label>
          <input
            id="project-name"
            type="text"
            value={config.name || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
            placeholder="my-awesome-project"
            required
          />
          <small>Use lowercase letters, numbers, and hyphens only</small>
        </div>

        <div className="form-group">
          <label htmlFor="project-category">Category *</label>
          <select
            id="project-category"
            value={config.category}
            onChange={(e) => setConfig(prev => ({ ...prev, category: e.target.value as 'personal' | 'professional' }))}
          >
            <option value="personal">Personal</option>
            <option value="professional">Professional</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="project-domain">Domain (optional)</label>
          <input
            id="project-domain"
            type="text"
            value={config.domain || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, domain: e.target.value }))}
            placeholder="example.com"
          />
          <small>If this project will be deployed to a specific domain</small>
        </div>

        <div className="form-group">
          <label htmlFor="project-subdomain">Subdomain (optional)</label>
          <input
            id="project-subdomain"
            type="text"
            value={config.subdomain || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, subdomain: e.target.value }))}
            placeholder="app"
          />
          <small>Subdomain for this project (e.g., app.example.com)</small>
        </div>

        <div className="form-group">
          <label htmlFor="project-description">Description</label>
          <textarea
            id="project-description"
            value={config.description || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your project..."
            rows={3}
          />
        </div>
      </form>

      <div className="wizard-actions">
        <button
          className="create-button"
          onClick={handleCreateProject}
          disabled={!config.name}
        >
          Create Project
        </button>
      </div>
    </div>
  );

  const renderCreating = () => (
    <div className="wizard-step creating">
      <div className="creating-animation">
        <div className="spinner"></div>
        <h3>Creating Your Project</h3>
        <p>Setting up {selectedTemplate?.name} template...</p>
        <div className="creating-steps">
          <div className="creating-step">📁 Creating directory structure</div>
          <div className="creating-step">📄 Generating project files</div>
          <div className="creating-step">⚙️ Configuring project settings</div>
          <div className="creating-step">🔍 Registering with PDE scanner</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content new-project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button className="close-button" onClick={handleClose} disabled={isCreating}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {currentStep === 'template' && renderTemplateSelection()}
          {currentStep === 'config' && renderProjectConfig()}
          {currentStep === 'creating' && renderCreating()}
        </div>
      </div>
    </div>
  );
}