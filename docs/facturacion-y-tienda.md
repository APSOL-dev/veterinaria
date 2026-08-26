## Facturación Unificada y Módulo Tienda (POS)

**Qué hace:** 
Representa el punto de venta (POS) unificado de la clínica. **Todas las prestaciones de servicios (Área Médica y Peluquería) y ventas de productos (Pet Shop/Farmacia) se facturan exclusivamente a través de este módulo.**

**Escenarios cubiertos:**
- Composición mixta del carrito: Adición de múltiples servicios y productos en la misma transacción.
- Selección de comprobante:
  - **Factura Oficial AFIP (Factura A, B, C):** Generación de comprobante electrónico fiscal con CAE simulado/SDK.
  - **Remito Interno (sin valor fiscal):** Registro de comprobante interno.
- **Descuento de stock en ambas modalidades:** Tanto al emitir Factura AFIP como Remito Interno, los productos incluidos descuentan automáticamente sus unidades del inventario.
- Medios de Pago: Efectivo, Tarjeta, Transferencia Bancaria.
- Cálculo de subtotal, porcentaje/monto de descuento, impuestos (IVA) y total definitivo.

**Casos borde conocidos:**
- Cancelación o anulación de comprobantes: Revierte los descuentos de stock realizados.
- Descuentos aplicables por ítem o globales al total de la cuenta.

**Restricciones o supuestos:**
- Los servicios prestables no descuentan stock pero figuran con su respectivo valor monetario en el ticket.
