export interface UserSubmission {
  type: 'user';
  name: string;
  email: string;
  university: string;
  currentStatus: string;
  financeExperience: string;
  timestamp: string;
}

export interface InvestorSubmission {
  type: 'investor';
  name: string;
  email: string;
  organization: string;
  role: string;
  investmentFocus: string;
  timestamp: string;
}

export type Submission = UserSubmission | InvestorSubmission;

const STORAGE_KEY = 'hugo_form_submissions';

export const saveSubmission = (data: Omit<Submission, 'timestamp'>): void => {
  const submission: Submission = {
    ...data,
    timestamp: new Date().toISOString(),
  } as Submission;

  const existing = getSubmissions();
  existing.push(submission);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
};

export const getSubmissions = (): Submission[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const clearSubmissions = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const exportSubmissionsAsCSV = (): string => {
  const submissions = getSubmissions();
  if (submissions.length === 0) return '';

  const userSubmissions = submissions.filter(s => s.type === 'user') as UserSubmission[];
  const investorSubmissions = submissions.filter(s => s.type === 'investor') as InvestorSubmission[];

  let csv = '=== USER SUBMISSIONS ===\n';
  if (userSubmissions.length > 0) {
    csv += 'Name,Email,University,Current Status,Finance Experience,Timestamp\n';
    userSubmissions.forEach(s => {
      csv += `"${s.name}","${s.email}","${s.university}","${s.currentStatus}","${s.financeExperience}","${s.timestamp}"\n`;
    });
  }

  csv += '\n=== INVESTOR SUBMISSIONS ===\n';
  if (investorSubmissions.length > 0) {
    csv += 'Name,Email,Organization,Role,Investment Focus,Timestamp\n';
    investorSubmissions.forEach(s => {
      csv += `"${s.name}","${s.email}","${s.organization}","${s.role}","${s.investmentFocus}","${s.timestamp}"\n`;
    });
  }

  return csv;
};

export const downloadSubmissionsCSV = (): void => {
  const csv = exportSubmissionsAsCSV();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hugo_submissions_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};