import { create } from 'zustand';

export const useSalesStore = create((set, get) => ({
  cart: [],
  addToCart: (item) => {
    const { cart } = get();
    const existing = cart.find(i => i.medicineId === item.medicineId);
    
    if (existing) {
      set({
        cart: cart.map(i => 
          i.medicineId === item.medicineId 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      });
    } else {
      set({ cart: [...cart, item] });
    }
  },
  updateQuantity: (medicineId, quantity) => 
    set(s => ({
      cart: s.cart.map(i => i.medicineId === medicineId ? { ...i, quantity } : i)
    })),
  removeFromCart: (medicineId) => 
    set(s => ({ cart: s.cart.filter(i => i.medicineId !== medicineId) })),
  clearCart: () => set({ cart: [] }),
}));
