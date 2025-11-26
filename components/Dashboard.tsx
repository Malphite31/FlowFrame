
import React, { useMemo, useState } from 'react';
import { StoryNodeData, ProjectTemplate, ViewMode } from '../types';
import { Node, Edge } from '@xyflow/react';

type SortOption = 'lastOpened' | 'lastUpdated' | 'name-az' | 'name-za';

export interface DashboardProject {
  id: string;
  name: string;
  thumbnailUrl?: string | null;
  lastOpenedAt: number;
  updatedAt: number;
  createdAt: number;
  isArchived?: boolean;
}


interface DashboardProps {
  projects: DashboardProject[];
  templates: ProjectTemplate[];
  onOpenProject: (id: string) => void;
  onCreateProject: () => void;
  onCreateFromTemplate: (template: ProjectTemplate) => void;
  onRenameProject: (id: string, name: string) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onArchiveProject: (id: string) => void;
}

const formatTimestamp = (value: number) => {
  const date = new Date(value);
  return date.toLocaleString();
};

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  templates,
  onOpenProject,
  onCreateProject,
  onCreateFromTemplate,
  onRenameProject,
  onDuplicateProject,
  onDeleteProject,
  onArchiveProject
}) => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('lastOpened');
  const [menuId, setMenuId] = useState<string | null>(null);

  React.useEffect(() => {
    const handleClick = () => setMenuId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const visibleProjects = useMemo(() => {
    const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

    return filtered.sort((a, b) => {
      if (sort === 'lastOpened') return b.lastOpenedAt - a.lastOpenedAt;
      if (sort === 'lastUpdated') return b.updatedAt - a.updatedAt;
      if (sort === 'name-az') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name); // name-za
    });
  }, [projects, search, sort]);

  const handleRename = (id: string, currentName: string) => {
    const next = prompt('Rename project', currentName);
    if (next && next.trim()) {
      onRenameProject(id, next.trim());
    }
  };

  const handleDuplicate = (id: string) => {
    onDuplicateProject(id);
  };

  const handleArchive = (id: string) => {
    if (confirm('Archive this project? You can still open it from the dashboard.')) {
      onArchiveProject(id);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this project permanently? This cannot be undone.')) {
      onDeleteProject(id);
    }
  };

  return (
    <div className="h-screen w-full bg-[#0f1115] text-white px-6 py-10 md:px-10 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto flex flex-col gap-10 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <svg className="w-8 h-8 text-davinci-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 19h20L12 2zm0 3.8l6.5 11.2H5.5L12 5.8z" /></svg>
              FlowFrame
            </h1>
            <p className="text-sm text-gray-400 mt-1 ml-1">Pre-production Visualization & Storyboarding</p>
          </div>
          <button
            onClick={onCreateProject}
            className="flex items-center gap-2 bg-davinci-accent text-[#0c101b] px-5 py-2.5 rounded-lg font-bold shadow-lg hover:shadow-[0_0_20px_rgba(94,154,255,0.4)] hover:-translate-y-0.5 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14m7-7H5" />
            </svg>
            New Blank Project
          </button>
        </div>

        {/* Templates Section */}
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Start from Template</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => onCreateFromTemplate(template)}
                className="group relative flex flex-col text-left bg-[#141821] border border-[#1f2430] rounded-xl overflow-hidden hover:border-davinci-accent/50 hover:shadow-xl transition-all h-40 ring-0 focus:ring-2 focus:ring-davinci-accent outline-none"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${template.previewColor} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                <div className="p-5 relative z-10 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-lg bg-[#1f2430] border border-[#3d3d3d] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                    {template.icon || (
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-100 group-hover:text-davinci-accent transition-colors">{template.name}</h3>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-2">{template.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="h-[1px] bg-[#1f2430] w-full"></div>

        {/* Recent Projects Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Recent Projects</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects..."
                  className="w-64 bg-[#141821] border border-[#1f2430] rounded-lg px-9 py-2 text-xs text-gray-200 focus:border-davinci-accent outline-none"
                />
                <svg
                  className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="bg-[#141821] border border-[#1f2430] text-xs text-gray-400 px-3 py-2 rounded-lg focus:border-davinci-accent outline-none"
              >
                <option value="lastOpened">Last opened</option>
                <option value="lastUpdated">Last updated</option>
                <option value="name-az">Name (A-Z)</option>
                <option value="name-za">Name (Z-A)</option>
              </select>
            </div>
          </div>

          {visibleProjects.length === 0 ? (
            <div className="border border-dashed border-[#1f2430] rounded-xl p-10 text-center text-gray-500 bg-[#121520]">
              No projects match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleProjects.map((project) => (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenProject(project.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onOpenProject(project.id); }}
                  className={`
                        group rounded-xl border border-[#1f2430] bg-[#141821] shadow-lg
                        hover:border-davinci-accent/60 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)]
                        transition-all text-left relative overflow-visible focus:outline-none focus:ring-2 focus:ring-davinci-accent
                        ${menuId === project.id ? 'z-50 ring-1 ring-davinci-accent/50' : 'z-0'}
                    `}
                >
                  <div className="relative h-40 bg-[#0d1018] rounded-t-xl overflow-hidden border-b border-[#1f2430]">
                    {project.thumbnailUrl ? (
                      <img src={project.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <svg className="w-12 h-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141821] via-transparent to-transparent opacity-50"></div>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-gray-200 truncate group-hover:text-white transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">Last opened: {formatTimestamp(project.lastOpenedAt)}</p>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuId(menuId === project.id ? null : project.id);
                          }}
                          className="p-1 rounded hover:bg-[#1f2430] text-gray-500 hover:text-white transition-colors"
                          title="Project actions"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM12 13.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM12 20.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></svg>
                        </button>
                        {menuId === project.id && (
                          <div
                            className="absolute right-0 mt-2 w-40 bg-[#0f1219] border border-[#1f2430] rounded-md shadow-2xl z-50 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2130] text-gray-300 hover:text-white" onClick={() => { setMenuId(null); onOpenProject(project.id); }}>Open</button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2130] text-gray-300 hover:text-white" onClick={() => { setMenuId(null); handleRename(project.id, project.name); }}>Rename</button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2130] text-gray-300 hover:text-white" onClick={() => { setMenuId(null); handleDuplicate(project.id); }}>Duplicate</button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2130] text-gray-300 hover:text-white" onClick={() => { setMenuId(null); handleArchive(project.id); }}>{project.isArchived ? 'Unarchive' : 'Archive'}</button>
                            <div className="h-[1px] bg-[#1f2430]"></div>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-[#2b1a1a] text-red-400" onClick={() => { setMenuId(null); handleDelete(project.id); }}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-600 mt-1">
                      <span>{project.isArchived ? 'Archived' : 'Active Project'}</span>
                      {project.thumbnailUrl && <span className="text-davinci-accent/70">Has Preview</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
