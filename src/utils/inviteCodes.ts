// Simple invite code management system
// In production, this would be handled by your backend/database

interface InviteCode {
  code: string;
  email?: string;
  name?: string;
  university?: string;
  used: boolean;
  createdAt: string;
  usedAt?: string;
}

const STORAGE_KEY = 'hugo_invite_codes';

// Pre-populated test codes for immediate testing
const DEFAULT_CODES: InviteCode[] = [
  {
    code: 'HUGO2024',
    used: false,
    createdAt: new Date().toISOString(),
  },
  {
    code: 'BETA001',
    used: false,
    createdAt: new Date().toISOString(),
  },
  {
    code: 'FINANCE123',
    used: false,
    createdAt: new Date().toISOString(),
  }
];

export const getInviteCodes = (): InviteCode[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with default codes
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CODES));
  return DEFAULT_CODES;
};

export const validateInviteCode = (code: string): boolean => {
  const codes = getInviteCodes();
  const foundCode = codes.find(c => c.code.toLowerCase() === code.toLowerCase() && !c.used);
  return !!foundCode;
};

export const markInviteCodeUsed = (code: string, userEmail: string): boolean => {
  const codes = getInviteCodes();
  const foundCode = codes.find(c => c.code.toLowerCase() === code.toLowerCase() && !c.used);
  
  if (foundCode) {
    foundCode.used = true;
    foundCode.usedAt = new Date().toISOString();
    foundCode.email = userEmail;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
    return true;
  }
  
  return false;
};

export const generateInviteCode = (
  name?: string, 
  email?: string, 
  university?: string
): string => {
  const codes = getInviteCodes();
  
  // Generate a unique code
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  const newCode = `HUGO${random}${timestamp.slice(-3).toUpperCase()}`;
  
  const inviteCode: InviteCode = {
    code: newCode,
    name,
    email,
    university,
    used: false,
    createdAt: new Date().toISOString(),
  };
  
  codes.push(inviteCode);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  
  return newCode;
};

export const getInviteCodeStats = () => {
  const codes = getInviteCodes();
  return {
    total: codes.length,
    used: codes.filter(c => c.used).length,
    available: codes.filter(c => !c.used).length,
  };
};

// Admin function to view all codes (accessible via browser console)
export const listAllInviteCodes = () => {
  const codes = getInviteCodes();
  console.table(codes);
  return codes;
};

// Admin function to generate multiple codes
export const generateBulkCodes = (count: number = 10): string[] => {
  const newCodes: string[] = [];
  for (let i = 0; i < count; i++) {
    newCodes.push(generateInviteCode());
  }
  console.log('Generated codes:', newCodes);
  return newCodes;
};

// Make functions available globally for admin use
if (typeof window !== 'undefined') {
  (window as any).hugoAdmin = {
    listInviteCodes: listAllInviteCodes,
    generateCodes: generateBulkCodes,
    generateCode: generateInviteCode,
    getStats: getInviteCodeStats,
  };
}