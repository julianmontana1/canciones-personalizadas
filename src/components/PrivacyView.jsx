import React from 'react';
import { UserCog, Database, Target, Share2, Archive, Fingerprint, Cookie, Lock, Baby, ScrollText, Mail } from 'lucide-react';
import LegalLayout, { LegalSection } from './legal/LegalLayout';

export default function PrivacyView({ onNavigate }) {
  return (
    <LegalLayout
      title="Política de Privacidad"
      intro={`Última actualización: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}. Así tratamos los datos que nos entregas al usar SerenatIA.`}
      currentHash="#/privacidad"
      onNavigate={onNavigate}
    >
      {/* 1. Responsable del tratamiento */}
      <LegalSection icon={UserCog} title="1. Responsable del tratamiento">
        <p>
          SerenatIA, operado por <strong className="text-white">[Nombre legal de tu empresa o persona
          natural, NIT/Cédula]</strong>, es responsable del tratamiento de los datos personales
          recopilados a través de este sitio, de conformidad con la Ley 1581 de 2012 y el Decreto 1377
          de 2013 sobre protección de datos personales en Colombia.
        </p>
      </LegalSection>

      {/* 2. Datos que recopilamos */}
      <LegalSection icon={Database} title="2. Datos que recopilamos" accent="text-pink-400">
        <p>Recopilamos únicamente los datos necesarios para prestar el servicio:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-1 marker:text-pink-400">
          <li><strong className="text-white">Código de acceso:</strong> el código que ingresas para generar tu canción.</li>
          <li><strong className="text-white">Datos del homenajeado:</strong> nombres, historia, anécdotas, estilo musical y duración que proporcionas voluntariamente en el formulario.</li>
          <li><strong className="text-white">Datos técnicos:</strong> dirección IP y marca de tiempo de la generación, usados únicamente para seguridad, prevención de abuso y soporte.</li>
        </ul>
        <p>
          SerenatIA no procesa pagos ni almacena datos de tarjetas o cuentas bancarias dentro de la
          plataforma: la adquisición del código de acceso se realiza a través de nuestros canales
          oficiales de venta, fuera de este sitio.
        </p>
      </LegalSection>

      {/* 3. Finalidad */}
      <LegalSection icon={Target} title="3. Finalidad del tratamiento" accent="text-amber-400">
        <p>Usamos tus datos para:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-1 marker:text-amber-400">
          <li>Generar y entregar la canción personalizada que encargaste.</li>
          <li>Gestionar tu código de acceso y el cupo de canciones disponible.</li>
          <li>Prevenir el uso abusivo del servicio (por ejemplo, moderación de contenido ofensivo o protegido por derechos de autor).</li>
          <li>Atender tus solicitudes de soporte o reclamos.</li>
          <li>Enviarte comunicaciones comerciales propias, únicamente si nos has dado tu consentimiento para ello.</li>
        </ul>
      </LegalSection>

      {/* 4. Compartición con terceros */}
      <LegalSection icon={Share2} title="4. Compartición de datos con terceros" accent="text-indigo-400">
        <p>
          No vendemos ni compartimos tus datos personales con terceros para fines comerciales propios de
          ellos. Solo compartimos datos en los siguientes casos:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-1 marker:text-indigo-400">
          <li>
            <strong className="text-white">Proveedores tecnológicos de generación musical:</strong> los
            datos del homenajeado (nombres, historia, estilo) son procesados por proveedores
            tecnológicos especializados en generación de audio mediante inteligencia artificial, que
            actúan como encargados del tratamiento. Estos datos se usan exclusivamente para crear tu
            canción y no se comparten con otros fines.
          </li>
          <li><strong className="text-white">Autoridades competentes:</strong> cuando la ley colombiana lo exija.</li>
        </ul>
      </LegalSection>

      {/* 5. Conservación */}
      <LegalSection icon={Archive} title="5. Conservación de datos" accent="text-teal-400">
        <p>
          Conservamos el registro de las canciones generadas (incluyendo el texto del formulario y el
          archivo de audio) por un plazo razonable, con fines de soporte, atención de reclamos y
          prevención de fraude. Puedes solicitar la eliminación de tus datos en cualquier momento
          escribiéndonos, salvo que la ley nos exija conservarlos por más tiempo.
        </p>
      </LegalSection>

      {/* 6. Derechos del titular */}
      <LegalSection icon={Fingerprint} title="6. Derechos del titular" accent="text-rose-400">
        <p>De acuerdo con la Ley 1581 de 2012 (Habeas Data), tienes derecho a:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-1 marker:text-rose-400">
          <li>Conocer, actualizar y rectificar tus datos personales.</li>
          <li>Solicitar prueba de la autorización otorgada para el tratamiento de tus datos.</li>
          <li>Solicitar la eliminación de tus datos cuando ya no sean necesarios o cuando revoques tu autorización.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a esta ley.</li>
        </ul>
        <p>
          Para ejercer estos derechos, escríbenos a{' '}
          <span className="text-purple-300 font-medium">soporte@serenatia.com</span>.
        </p>
      </LegalSection>

      {/* 7. Cookies y almacenamiento local */}
      <LegalSection icon={Cookie} title="7. Cookies y almacenamiento local" accent="text-emerald-400">
        <p>
          Este sitio utiliza el almacenamiento local de tu navegador (localStorage) únicamente para
          recordar tu código de acceso y tu última canción generada, de modo que puedas volver a verla
          sin perderla al recargar la página. Esta información permanece en tu propio dispositivo y no
          la compartimos con terceros. No utilizamos cookies de rastreo publicitario.
        </p>
      </LegalSection>

      {/* 8. Seguridad */}
      <LegalSection icon={Lock} title="8. Seguridad">
        <p>
          Implementamos medidas técnicas y organizativas razonables para proteger tus datos contra
          accesos no autorizados, pérdida o destrucción. Todas las comunicaciones con este sitio se
          realizan bajo protocolo HTTPS/SSL. Ninguna medida de seguridad es infalible, por lo que no
          podemos garantizar protección absoluta.
        </p>
      </LegalSection>

      {/* 9. Menores de edad */}
      <LegalSection icon={Baby} title="9. Menores de edad" accent="text-amber-400">
        <p>
          SerenatIA está dirigido a personas mayores de edad que contratan el servicio como compradores
          o responsables, incluso cuando la canción esté dedicada a un niño o niña (por ejemplo, una
          nana o una canción de fiesta infantil). No recopilamos intencionalmente datos de contacto de
          menores de edad.
        </p>
      </LegalSection>

      {/* 10. Modificaciones */}
      <LegalSection icon={ScrollText} title="10. Modificaciones">
        <p>
          Esta Política puede actualizarse. La versión vigente siempre estará disponible en esta página
          con la fecha de última modificación.
        </p>
      </LegalSection>

      {/* 11. Contacto */}
      <LegalSection icon={Mail} title="11. Contacto">
        <p>
          Para preguntas sobre esta Política de Privacidad, escríbenos a{' '}
          <span className="text-purple-300 font-medium">soporte@serenatia.com</span> o por WhatsApp al{' '}
          <span className="text-purple-300 font-medium">+57 300 000 0000</span>.
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
