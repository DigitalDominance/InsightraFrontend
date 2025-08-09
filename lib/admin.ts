// Admin address - only this address has admin access
export const ADMIN_ADDRESS = '0xA0c5048c32870bB66d0BE861643cD6Bb5F66Ada2';

export function isAdmin(address: string | undefined): boolean {
  if (!address) return false;
  return address.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
}
