import { useCart, useStore } from "@/lib/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function Cart() {
  const { state, dispatch } = useStore();
  const { clearCart } = useCart();

  const router = useRouter();

  const handleCheckout = () => {
    router.push("/checkout");
  };

  const updateQuantity = (
    productId: string,
    variantId: string | undefined,
    quantity: number
  ) => {
    if (quantity < 1) {
      dispatch({
        type: "REMOVE_FROM_CART",
        payload: { productId, variantId },
      });
    } else {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { productId, variantId, quantity },
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
      {state.cart.length === 0 ? (
        <p className="text-gray-500">Your cart is empty</p>
      ) : (
        <>
          <div className="space-y-4">
            {state.cart.map((item) => (
              <div
                key={`${item.product.id}-${item.variant?.id}`}
                className="flex items-center justify-between border-b pb-4"
              >
                <div className="flex items-center space-x-4">
                  {item.product.thumbnail_url && (
                    <img
                      src={item.product.thumbnail_url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{item.product.name}</h3>
                    {item.variant && (
                      <p className="text-sm text-gray-500">
                        {item.variant.name}
                      </p>
                    )}
                    <p className="text-primary font-medium">
                      {formatCurrency(
                        item.variant?.price || item.product.price,
                        item.variant?.currency || item.product.currency
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.product.id,
                        item.variant?.id,
                        item.quantity - 1
                      )
                    }
                    className="text-gray-500 hover:text-gray-700"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.product.id,
                        item.variant?.id,
                        item.quantity + 1
                      )
                    }
                    className="text-gray-500 hover:text-gray-700"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(state.total)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full mt-4 bg-primary text-white py-2 rounded hover:bg-primary/90"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={clearCart}
              className="w-full mt-4 bg-destructive text-white py-2 rounded hover:bg-primary/90"
            >
              Clear Cart
            </button>
          </div>
        </>
      )}
    </div>
  );
}
