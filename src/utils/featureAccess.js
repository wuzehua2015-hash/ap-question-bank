export function hasLynkStudentAccess({ accountLevel, entitlements } = {}) {
  return accountLevel === 'internal' || (entitlements || []).some(item => item.feature_key === 'full_access')
}

export function accountLevelLabel(accountLevel, isLynkStudent = false) {
  if (isLynkStudent) return '翎英学员'
  if (accountLevel === 'free') return '注册会员'
  return '游客'
}
