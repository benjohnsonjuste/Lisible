export const updateLocalLi = (amount, isReduction = false) => {
  const logged = localStorage.getItem("lisible_user");
  if (!logged) return;

  const user = JSON.parse(logged);
  const newBalance = isReduction ? (user.li || 0) - amount : (user.li || 0) + amount;
  
  const updatedUser = { ...user, li: newBalance };
  localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
  
  // Déclenche un événement personnalisé pour que tous les composants s'actualisent
  window.dispatchEvent(new Event("li-balance-updated"));
  return updatedUser;
};
