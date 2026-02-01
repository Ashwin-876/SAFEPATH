import React, { useState } from 'react';
import { Coordinates } from '../types';

interface CommunityReportsProps {
  currentLocation: Coordinates | null;
}

type HazardType = 'Construction' | 'Broken Sidewalk' | 'Stairs' | 'Roadblock' | 'Other';
type Severity = 'Low' | 'Medium' | 'High';

interface Report {
  id: string;
  type: HazardType;
  location: string;
  timestamp: number;
  severity: Severity;
  distance: string; // Mock distance string eg "50m away"
}

const CommunityReports: React.FC<CommunityReportsProps> = ({ currentLocation }) => {
  const [reports, setReports] = useState<Report[]>([
    { id: '1', type: 'Construction', location: 'Broadway & 116th', timestamp: Date.now() - 600000, severity: 'High', distance: '120m away' },
    { id: '2', type: 'Broken Sidewalk', location: 'Amsterdam Ave', timestamp: Date.now() - 7200000, severity: 'Medium', distance: '350m away' },
    { id: '3', type: 'Stairs', location: 'Riverside Bvld', timestamp: Date.now() - 604800000, severity: 'Low', distance: '0.8km away' },
  ]);

  const [isReporting, setIsReporting] = useState(false);
  const [newReportType, setNewReportType] = useState<HazardType | null>(null);
  const [newReportSeverity, setNewReportSeverity] = useState<Severity>('Medium');

  const hazardTypes: HazardType[] = ['Construction', 'Broken Sidewalk', 'Stairs', 'Roadblock', 'Other'];

  const handleSubmit = () => {
    if (!newReportType) return;

    const newReport: Report = {
      id: Math.random().toString(36).substr(2, 9),
      type: newReportType,
      location: currentLocation
        ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
        : 'Unknown Location',
      timestamp: Date.now(),
      severity: newReportSeverity,
      distance: 'Just now', // Ideally calculated
    };

    setReports([newReport, ...reports]);
    setIsReporting(false);
    setNewReportType(null);
    setNewReportSeverity('Medium');
  };

  const getTimeString = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Low': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 pb-32 max-w-2xl mx-auto min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Community<br />Reports</h2>
          {currentLocation && <p className="text-slate-500 text-sm font-medium mt-1">Near {currentLocation.lat.toFixed(3)}, {currentLocation.lng.toFixed(3)}</p>}
        </div>

        <button
          onClick={() => setIsReporting(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-2xl shadow-lg shadow-amber-600/20 flex items-center space-x-2 font-bold transition-transform active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Report Hazard</span>
        </button>
      </div>

      {/* Main Content: List or Reporting Form */}
      {!isReporting ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-700">Active Hazards Nearby</h3>
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{reports.length} Reports</span>
          </div>

          <div className="grid gap-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">

                {/* Icon Box */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${report.type === 'Construction' ? 'bg-orange-100 text-orange-600' :
                    report.type === 'Roadblock' ? 'bg-red-100 text-red-600' :
                      report.type === 'Stairs' ? 'bg-purple-100 text-purple-600' :
                        'bg-slate-100 text-slate-600'
                  }`}>
                  {report.type === 'Construction' && '🚧'}
                  {report.type === 'Broken Sidewalk' && '🏚️'}
                  {report.type === 'Roadblock' && '🛑'}
                  {report.type === 'Stairs' && '🪜'}
                  {report.type === 'Other' && '⚠️'}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-bold text-slate-800">{report.type}</h4>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                  </div>
                  <p className="text-slate-500 font-medium text-sm mt-1">{report.location}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-bold">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {getTimeString(report.timestamp)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{report.distance}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 mt-8">
            <h4 className="text-blue-900 font-bold mb-1 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Community Impact
            </h4>
            <p className="text-blue-800 text-sm leading-relaxed">
              Your reports directly update the SafePath navigation engine, helping {reports.length * 12} other users avoid obstacles today.
            </p>
          </div>

        </div>
      ) : (
        /* REPORTING MODAL / FORM */
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800">New Hazard Report</h3>
            <button onClick={() => setIsReporting(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full p-2 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Hazard Type</label>
              <div className="grid grid-cols-2 gap-3">
                {hazardTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setNewReportType(type)}
                    className={`p-4 rounded-xl font-bold text-left transition-all border-2 ${newReportType === type
                        ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md transform scale-[1.02]'
                        : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Severity Level</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(['Low', 'Medium', 'High'] as Severity[]).map(level => (
                  <button
                    key={level}
                    onClick={() => setNewReportSeverity(level)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${newReportSeverity === level
                        ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5'
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="font-mono">
                  {currentLocation
                    ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`
                    : "Waiting for GPS..."}
                </span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={!newReportType}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center space-x-2 transition-all ${newReportType
                    ? 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                <span>Submit Report</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CommunityReports;
