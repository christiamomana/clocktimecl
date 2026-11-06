import { collection, config, fields } from '@keystatic/core';

// Almacenamiento:
// - En desarrollo (`npm run dev`) el admin escribe directo en los archivos del repo (modo local).
// - Con PUBLIC_KEYSTATIC_STORAGE=github (producción, ver README), cada cambio se guarda como commit en GitHub
//   y solo pueden entrar quienes tengan permiso de escritura en el repositorio.
const useGithub = import.meta.env?.PUBLIC_KEYSTATIC_STORAGE === 'github';

export default config({
  storage: useGithub
    ? { kind: 'github', repo: { owner: 'christiamomana', name: 'clocktimecl' } }
    : { kind: 'local' },
  ui: {
    brand: { name: 'Clock Time Chile' },
    navigation: { Vitrina: ['relojes'] },
  },
  locale: 'es-ES',
  collections: {
    relojes: collection({
      label: 'Relojes',
      path: 'src/content/relojes/*',
      format: { data: 'json' },
      slugField: 'modelo',
      columns: ['marca', 'modelo', 'estado', 'orden'],
      entryLayout: 'form',
      schema: {
        marca: fields.text({ label: 'Marca', validation: { isRequired: true } }),
        modelo: fields.slug({
          name: { label: 'Modelo', description: 'Nombre del modelo, p. ej. "Radiomir S.L.C.".', validation: { isRequired: true } },
          slug: { label: 'Identificador (URL)', description: 'Se genera solo a partir del modelo.' },
        }),
        referencia: fields.text({ label: 'Referencia', description: 'P. ej. PAM00425, o "Vintage".', validation: { isRequired: true } }),
        medida: fields.text({ label: 'Medida o material', description: 'Se muestra junto a la referencia: "47 mm", "Acero y oro"…', validation: { isRequired: true } }),
        estado: fields.select({
          label: 'Estado',
          options: [
            { label: 'Disponible', value: 'disponible' },
            { label: 'Reservado', value: 'reservado' },
            { label: 'Vendido', value: 'vendido' },
          ],
          defaultValue: 'disponible',
        }),
        publicado: fields.checkbox({ label: 'Mostrar en la página', defaultValue: true }),
        orden: fields.integer({ label: 'Orden en el carrusel', description: 'Los números menores van primero.', defaultValue: 100, validation: { isRequired: true } }),
        etiqueta: fields.text({ label: 'Etiqueta (opcional)', description: 'Aparece sobre la foto, p. ej. "Edición de 200".' }),
        imagen: fields.image({
          label: 'Foto',
          description: 'Vertical (4:5 o similar), la pieza centrada, fondo oscuro. Mínimo 1100 px de ancho.',
          directory: 'src/assets/relojes',
          publicPath: '../../assets/relojes/',
          validation: { isRequired: true },
        }),
        encuadre: fields.select({
          label: 'Encuadre de la foto',
          description: 'Qué parte de la foto se mantiene visible cuando se recorta.',
          options: [
            { label: 'Centro', value: '50% 50%' },
            { label: 'Un poco arriba', value: '50% 40%' },
            { label: 'Arriba', value: '50% 30%' },
            { label: 'Un poco abajo', value: '50% 60%' },
            { label: 'Abajo', value: '50% 72%' },
          ],
          defaultValue: '50% 50%',
        }),
        descripcion: fields.text({ label: 'Descripción', multiline: true, validation: { isRequired: true } }),
        especificaciones: fields.array(
          fields.object({
            nombre: fields.text({ label: 'Dato', description: 'P. ej. Calibre', validation: { isRequired: true } }),
            valor: fields.text({ label: 'Valor', description: 'P. ej. P.3000, cuerda manual', validation: { isRequired: true } }),
          }),
          {
            label: 'Especificaciones',
            description: 'Se muestran 4 en la ficha. Nunca inventes datos técnicos.',
            itemLabel: (p) => `${p.fields.nombre.value || 'Dato'}: ${p.fields.valor.value}`,
            validation: { length: { max: 6 } },
          },
        ),
        incluye: fields.array(fields.text({ label: 'Ítem' }), {
          label: 'Qué incluye',
          description: 'P. ej. Reloj, Caja original, Documentación, Garantía 3 meses.',
          itemLabel: (p) => p.value || 'Ítem',
        }),
      },
    }),
  },
});
