import React, { useMemo, useState } from 'react';

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
  onOpenProject: (id: string) => void;
  onCreateProject: () => void;
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
  onOpenProject, 
  onCreateProject,
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
    <div className="min-h-screen w-full bg-[#0f1115] text-white px-10 py-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Projects Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Browse, search, and jump back into your work.</p>
          </div>
          <button
            onClick={onCreateProject}
            className="flex items-center gap-2 bg-davinci-accent text-[#0c101b] px-4 py-2 rounded-md font-semibold shadow-lg hover:shadow-[0_10px_30px_rgba(94,154,255,0.35)] hover:-translate-y-0.5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14m7-7H5" />
            </svg>
            New Project
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-[#141821] border border-[#1f2430] rounded-lg px-10 py-3 text-sm text-gray-200 focus:border-davinci-accent outline-none shadow-inner shadow-black/40"
            />
            <svg
              className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"
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
            className="bg-[#141821] border border-[#1f2430] text-sm text-gray-200 px-3 py-2 rounded-lg focus:border-davinci-accent outline-none"
          >
            <option value="lastOpened">Last opened</option>
            <option value="lastUpdated">Last updated</option>
            <option value="name-az">Name (A-Z)</option>
            <option value="name-za">Name (Z-A)</option>
          </select>
        </div>

        {visibleProjects.length === 0 ? (
          <div className="border border-dashed border-[#1f2430] rounded-xl p-10 text-center text-gray-500 bg-[#121520]">
            No projects match your search. Create a new one to get started.
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
                className="group rounded-xl border border-[#1f2430] bg-gradient-to-br from-[#141821] to-[#0f1219] shadow-lg hover:border-davinci-accent/60 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-all text-left relative overflow-visible focus:outline-none focus:ring-2 focus:ring-davinci-accent"
              >
                <div className="relative h-40 bg-[#0d1018]">
                  {project.thumbnailUrl ? (
                    <img src={project.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-90" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm uppercase tracking-wider bg-[radial-gradient(circle_at_20%_20%,rgba(94,154,255,0.15),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(94,154,255,0.1),transparent_25%),linear-gradient(135deg,#111827,#0b0f15)]">
                      No Preview
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white truncate group-hover:text-davinci-accent transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-[11px] text-gray-500">Last opened: {formatTimestamp(project.lastOpenedAt)}</p>
                      <p className="text-[11px] text-gray-600">Updated: {formatTimestamp(project.updatedAt)}</p>
                      <p className="text-[11px] text-gray-600">Created: {formatTimestamp(project.createdAt)}</p>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuId(menuId === project.id ? null : project.id);
                        }}
                        className="p-1 rounded hover:bg-[#1f2430] text-gray-400 hover:text-white transition-colors"
                        title="Project actions"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM12 13.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM12 20.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></svg>
                      </button>
                      {menuId === project.id && (
                        <div 
                          className="absolute right-0 mt-2 w-40 bg-[#0f1219] border border-[#1f2430] rounded-md shadow-xl z-30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2130]" onClick={() => { setMenuId(null); onOpenProject(project.id); }}>Open</button>
                          <button className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2130]" onClick={() => { setMenuId(null); handleRename(project.id, project.name); }}>Rename</button>
                          <button className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2130]" onClick={() => { setMenuId(null); handleDuplicate(project.id); }}>Duplicate</button>
                          <button className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2130]" onClick={() => { setMenuId(null); handleArchive(project.id); }}>{project.isArchived ? 'Archived' : 'Archive'}</button>
                          <button className="w-full text-left px-3 py-2 text-sm hover:bg-[#2b1a1a] text-red-300" onClick={() => { setMenuId(null); handleDelete(project.id); }}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{project.isArchived ? 'Archived' : 'Active'}</span>
                    <span className="px-2 py-1 rounded-full bg-[#1b2130] border border-[#1f2430] text-gray-400">Open</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
