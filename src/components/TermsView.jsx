import React from 'react';
import { ScrollText, ShieldCheck, Sparkles, Music2, Ban, KeyRound, Mail, Scale, ListChecks } from 'lucide-react';
import LegalLayout, { LegalSection } from './legal/LegalLayout';

export default function TermsView({ onNavigate }) {
  return (
    <LegalLayout
      title="Términos y Condiciones"
      intro={`Última actualización: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}. Al usar SerenatIA y generar una canción personalizada, aceptas los siguientes términos.`}
      currentHash="#/terminos"
      onNavigate={onNavigate}
    >
      {/* 1. Identificación */}
      <LegalSection icon={ScrollText} title="1. Identificación del proveedor">
        <p>
          SerenatIA es un servicio de creación de canciones personalizadas mediante inteligencia
          artificial, operado por <strong className="text-white">[Nombre legal de tu empresa o persona
          natural, NIT/Cédula]</strong>. Contacto: soporte@serenatia.com.
        </p>
      </LegalSection>

      {/* 2. Descripción del servicio */}
      <LegalSection icon={Music2} title="2. Descripción del servicio" accent="text-pink-400">
        <p>
          SerenatIA permite al usuario encargar una canción original generada por inteligencia
          artificial, personalizada según la información proporcionada (nombres del homenajeado,
          ocasión, estilo musical, anécdotas y duración). El resultado es un archivo de audio MP3 que
          se reproduce y descarga directamente en nuestro sitio, de forma prácticamente inmediata.
        </p>
        <p>
          La composición es generada por un proceso automatizado. No se trata de una producción
          musical realizada por artistas humanos en estudio, sino de un resultado creado por
          inteligencia artificial a partir de la información que el cliente entrega.
        </p>
      </LegalSection>

      {/* 3. Proceso de uso */}
      <LegalSection icon={ListChecks} title="3. Proceso de uso" accent="text-teal-400">
        <p>El uso del servicio sigue estos pasos:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-1 marker:text-teal-400">
          <li>El cliente adquiere un código de acceso a través de nuestros canales oficiales de venta, según el plan elegido (una canción, paquete de varias, u otro).</li>
          <li>El cliente ingresa su código en el sitio y completa el formulario con los nombres, la historia y el estilo musical deseado.</li>
          <li>La inteligencia artificial genera la canción de forma automática, en un tiempo aproximado de pocos minutos.</li>
          <li>La canción queda disponible de inmediato para reproducirse y descargarse desde el navegador, y consume uno de los cupos disponibles en el código utilizado.</li>
        </ul>
        <p>
          A diferencia de otros servicios, la generación consume el cupo del código en el momento de
          la creación, por lo que te recomendamos revisar cuidadosamente los datos del formulario antes
          de confirmar.
        </p>
      </LegalSection>

      {/* 4. Límites de la creación */}
      <LegalSection icon={Sparkles} title="4. Límites de la creación" accent="text-amber-400">
        <p>
          La calidad y precisión del resultado final dependen directamente de la claridad y el detalle
          de la información entregada. SerenatIA no garantiza que la canción reproduzca de forma exacta
          cada detalle solicitado, ni una interpretación artística específica: la IA compone de forma
          creativa e interpretativa, no literal.
        </p>
        <p>No podemos garantizar ni ofrecer:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-1 marker:text-amber-400">
          <li>Imitación de la voz, estilo o interpretación de un artista, banda o canción existente.</li>
          <li>Reproducción exacta de una melodía, letra o arreglo preexistente protegido por derechos de autor.</li>
          <li>Resultados idénticos entre distintos intentos de generación, incluso con el mismo texto.</li>
          <li>Corrección editorial de la información entregada por el cliente (nombres, fechas, ortografía).</li>
        </ul>
        <p>
          Por esta razón, no se aceptan solicitudes que hagan referencia a artistas, bandas o canciones
          protegidas por derechos de autor, ni contenido ofensivo, discriminatorio o inapropiado. Estas
          solicitudes son ajustadas automáticamente o rechazadas antes de generar la canción.
        </p>
      </LegalSection>

      {/* 5. Propiedad intelectual */}
      <LegalSection icon={ShieldCheck} title="5. Propiedad intelectual" accent="text-indigo-400">
        <p>
          La tecnología, los algoritmos, el sistema de generación y todos los procesos utilizados para
          crear las canciones son propiedad exclusiva de SerenatIA. El cliente no adquiere ningún
          derecho sobre dicha tecnología.
        </p>
        <p>
          Al recibir tu canción de forma exitosa, obtienes una licencia personal para escucharla,
          descargarla y compartirla libremente en tus redes sociales, celebraciones y espacios privados
          (por ejemplo, enviarla por WhatsApp o publicarla como dedicatoria). Esta licencia es para uso
          personal y no comercial: no incluye la explotación comercial de la obra (venta, licenciamiento
          a terceros, publicidad de marca, etc.) sin autorización expresa y por escrito de SerenatIA.
        </p>
        <p>
          SerenatIA se reserva el derecho de conservar copia de las canciones generadas para fines de
          soporte, verificación de calidad y cumplimiento de estos términos.
        </p>
      </LegalSection>

      {/* 6. Acceso y códigos */}
      <LegalSection icon={KeyRound} title="6. Acceso y códigos de uso" accent="text-emerald-400">
        <ul className="list-disc list-inside space-y-1.5 pl-1 marker:text-emerald-400">
          <li>Cada código tiene un número determinado de canciones disponibles según el plan comprado.</li>
          <li>El código es de uso personal: compartirlo, revenderlo o transferirlo a terceros puede resultar en su desactivación.</li>
          <li>Es responsabilidad del cliente conservar y proteger su código de acceso.</li>
        </ul>
      </LegalSection>

      {/* 7. Uso aceptable */}
      <LegalSection icon={Ban} title="7. Uso aceptable y contenido prohibido" accent="text-rose-400">
        <p>Al usar SerenatIA, el cliente se compromete a no incluir en su solicitud:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-1 marker:text-rose-400">
          <li>Lenguaje ofensivo, discriminatorio, difamatorio o de odio.</li>
          <li>Nombres de artistas, bandas, canciones o marcas protegidas por derechos de autor.</li>
          <li>Contenido ilegal, amenazante o que busque suplantar o difamar a terceros sin su consentimiento.</li>
        </ul>
        <p>
          SerenatIA se reserva el derecho de ajustar automáticamente o rechazar cualquier solicitud que
          infrinja estos lineamientos. El rechazo de una solicitud por este motivo no da lugar a reclamo
          ni a reintento, ya que la responsabilidad del contenido enviado es del cliente.
        </p>
      </LegalSection>

      {/* 8. Reembolsos (pointer to dedicated page) */}
      <LegalSection icon={ScrollText} title="8. Reclamos y reembolsos">
        <p>
          Por ser un producto digital de bajo costo y entrega inmediata, SerenatIA no realiza
          devoluciones de dinero. Ante un reclamo válido, la única solución disponible es un reintento
          de generación de la canción. Consulta el detalle completo en nuestra{' '}
          <button type="button" onClick={() => onNavigate('#/reembolsos')} className="text-purple-300 hover:text-pink-300 font-semibold underline underline-offset-2">
            Política de Reembolsos
          </button>.
        </p>
      </LegalSection>

      {/* 9. Limitación de responsabilidad */}
      <LegalSection icon={ScrollText} title="9. Limitación de responsabilidad">
        <p>
          El servicio se ofrece "tal cual" ("as is"). SerenatIA no garantiza que el resultado generado
          sea perfecto o esté libre de imperfecciones propias de un proceso de creación automatizada por
          inteligencia artificial. En ningún caso SerenatIA será responsable por daños indirectos,
          emocionales o de cualquier otra naturaleza derivados del uso del servicio o del contenido de la
          canción entregada.
        </p>
      </LegalSection>

      {/* 10. Ley aplicable */}
      <LegalSection icon={Scale} title="10. Ley aplicable y jurisdicción" accent="text-sky-400">
        <p>
          Estos Términos se rigen por las leyes de la República de Colombia, incluyendo la Ley 1480 de
          2011 (Estatuto del Consumidor). Cualquier disputa será sometida a las autoridades y jueces
          competentes de Colombia, sin perjuicio de los derechos que asisten a los consumidores ante la
          Superintendencia de Industria y Comercio (SIC).
        </p>
      </LegalSection>

      {/* 11. Modificaciones */}
      <LegalSection icon={ScrollText} title="11. Modificaciones">
        <p>
          SerenatIA puede actualizar estos Términos y Condiciones en cualquier momento. Los cambios
          entran en vigor desde su publicación en esta página. El uso continuado del servicio implica
          la aceptación de los términos vigentes.
        </p>
      </LegalSection>

      {/* 12. Contacto */}
      <LegalSection icon={Mail} title="12. Contacto">
        <p>
          Si tienes preguntas sobre estos términos o quieres reportar un problema con tu canción,
          escríbenos a <span className="text-purple-300 font-medium">soporte@serenatia.com</span> o por
          WhatsApp al <span className="text-purple-300 font-medium">+57 300 000 0000</span>.
        </p>
      </LegalSection>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => onNavigate('')}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-pink-500 hover:from-purple-500 hover:via-pink-500 hover:to-pink-400 text-white font-bold text-sm shadow-xl shadow-pink-900/40 hover:scale-105 active:scale-95 transition-all"
        >
          Volver al inicio
        </button>
      </div>
    </LegalLayout>
  );
}
