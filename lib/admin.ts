// Admin address - only this address has admin access
export const ADMIN_ADDRESS = '0xD031272E734F2B38515F2F55F2F935d3227b739d';

export function isAdmin(address: string | undefined): boolean {
  if (!address) return false;
  return address.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
}
