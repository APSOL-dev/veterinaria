## Estándar Estricto de Alineación y Eliminación de Íconos en Títulos

**Qué hace:** 
Este documento define la regla estricta de posicionamiento y alineación limpia de los encabezados principales en todos los módulos y submódulos de VETSOFT.

**Reglas de Alineación e Íconos:**
1. **Eliminación Total de Íconos en Encabezados:**
   - Queda estrictamente prohibida la inclusión de cajas con íconos (ej: estetoscopios, jeringas, etc.) al lado de los títulos principales de módulo.
   - El texto del título inicia exactamente sobre el margen izquierdo principal.
2. **Alineación Impecable:**
   - Todos los títulos principales de pantalla inician exactamente en la misma posición superior izquierda del área de contenido principal (`flex items-center justify-between mb-md`).
   - Se removieron los envoltorios o cajas de tarjetas (`bg-white rounded-2xl p-md shadow-sm`) que desplazaban los títulos hacia adentro en vistas como *Nueva Consulta*, *Cobros* o *Vacunas*.

## Estándares de Accesibilidad y Responsividad Mobile (360px - 768px)

**Qué hace:** 
Garantiza una experiencia táctil fluida, ergonómica y accesible en smartphones y tablets, cumpliendo con los estándares de diseño WCAG 2.1 y directrices de usabilidad móvil (Errores M3, M4 y M9).

**Reglas de Mobile & Touch:**
1. **Áreas de Toque Táctiles de 44px (Error M3):**
   - Todos los botones principales, solapas de submódulos (`min-h-[44px]`), ítems del menú lateral, acciones de fila en tablas y botones interactivos en tarjetas mobile cuentan con una zona táctil mínima de `44px` de alto (`min-h-[44px]`) y `44px` de ancho (`min-w-[44px]`).
   - **Separación visual y confirmación destructiva:** Las acciones de "Editar" y "Eliminar" se separan con espaciado y estilos visuales distintivos (botón de editar en tono primario/borde neutro, botón de eliminar en fondo suave `bg-red-50 text-red-600`). Las eliminaciones permanentes siempre abren un modal de confirmación explícito (`AppConfirmModal` con `isDanger={true}`).

2. **Inventario y Servicios como Tarjetas en Celular (Error M4):**
   - En dispositivos móviles (`md:hidden`), las listas de productos y catálogo de servicios se muestran automáticamente como tarjetas individuales responsivas a ancho completo.
   - Cada tarjeta de producto muestra: nombre del producto, categoría, stock actual vs. mínimo con badge contextual de estado (`Al día`, `Stock bajo`, `Agotado`), precio de venta destacado y botones de acción rápida con zona táctil de 44px (`[Ajustar stock]`, `[Editar]`, `[Eliminar]`).
   - Cada tarjeta de servicio presenta: nombre, categoría, precio, descripción, botón de activación/desactivación táctil y acciones separadas de modificación y eliminación con confirmación.

3. **Teclados Virtuales Correctos y Contextuales (Error M9):**
   - **Numérico puro (`inputMode="numeric" pattern="[0-9]*"`):** Punto de venta, número de factura/remito, cantidades en stock, días de frecuencia/vencimiento, porcentajes enteros de descuento e inflación, plazos a crédito.
   - **Numérico decimal (`inputMode="decimal"`):** Precios unitarios de productos y servicios, importes en caja, subtotal, impuestos/percepciones, cuotas, montos de pago a proveedores y peso corporal de pacientes en kg (`weightKg`).
   - **Teléfonos (`type="tel" inputMode="tel" autoComplete="tel"`):** Teléfonos de contacto de tutores y proveedores.
   - **Correos electrónicos (`type="email" inputMode="email" autoComplete="email"`):** Direcciones de correo electrónico en registro de tutores y facturación.

4. **Prevención de Auto-Zoom en iOS / Safari:**
   - Todos los campos de entrada (`input:not([type="checkbox"]):not([type="radio"]), select, textarea`) cuentan con un tamaño de fuente mínimo de `16px` en viewports `<= 768px` para evitar que Safari en iPhone aplique zoom automático al enfocar el control.

5. **Accesibilidad de Iconos (`aria-hidden="true"`):**
   - Los glifos decorativos de fuentes tipográficas (`material-symbols-outlined`) incluyen `aria-hidden="true"` para prevenir que los lectores de pantalla vocalicen el nombre del icono en lugar del contenido de la interfaz.
