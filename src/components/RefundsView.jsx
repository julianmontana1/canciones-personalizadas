import React from 'react';
import { Ban, RefreshCw, Scale, MessageCircle } from 'lucide-react';
import LegalLayout, { LegalSection } from './legal/LegalLayout';

export default function RefundsView({ onNavigate }) {
  return (
    <LegalLayout
      title="Política de Reembolsos"
      intro={`Última actualización: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}. SerenatIA es un servicio accesible y de bajo costo; por eso nuestra política de reclamos se basa en corregir el resultado, no en devolver dinero.`}
      currentHash="#/reembolsos"
      onNavigate={onNavigate}
    >
      {/* 1. Regla general */}
      <LegalSection icon={Ban} title="1. Regla general: sin devoluciones de dinero" accent="text-rose-400">
        <p className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs sm:text-sm">
          <strong>SerenatIA no realiza devoluciones de dinero bajo ninguna circunstancia.</strong> Al
          ser un producto digital de bajo costo, con generación y entrega automática e inmediata, la
          única compensación disponible ante un reclamo válido es un{' '}
          <strong>reintento de creación de la canción</strong>, sin costo adicional y usando el mismo
          código de acceso.
        </p>
      </LegalSection>

      {/* 2. Excepciones - reintentos */}
      <LegalSection icon={RefreshCw} title="2. Cuándo ofrecemos un reintento" accent="text-emerald-400">
        <p>Ofrecemos un reintento de generación, sin costo, cuando el problema es atribuible al servicio, por ejemplo:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-1 marker:text-emerald-400">
          <li>El archivo de audio no carga, está dañado o no se puede reproducir.</li>
          <li>La canción generada no corresponde en absoluto a la información entregada en el formulario (por ejemplo, un nombre, ocasión o estilo completamente distinto al solicitado).</li>
          <li>La duración entregada no corresponde a la seleccionada al momento de generar.</li>
        </ul>
        <p>
          Para solicitarlo, contáctanos dentro de las 48 horas siguientes a la generación de tu canción
          indicando tu código de acceso y describiendo el problema.
        </p>
      </LegalSection>

      {/* 3. Qué NO da lugar a reintento */}
      <LegalSection icon={Ban} title="3. Qué no da lugar a reintento" accent="text-amber-400">
        <p>No se consideran motivo válido de reclamo:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-1 marker:text-amber-400">
          <li>Diferencias de gusto o preferencias subjetivas sobre la melodía, el ritmo o la interpretación (la composición es creada por inteligencia artificial y su resultado creativo puede variar).</li>
          <li>Errores de ortografía, nombres o datos que el propio cliente haya escrito de forma incorrecta en el formulario.</li>
          <li>Solicitudes rechazadas por infringir nuestros Términos y Condiciones (lenguaje ofensivo, referencias a artistas o contenido protegido).</li>
        </ul>
      </LegalSection>

      {/* 4. Derecho de retracto */}
      <LegalSection icon={Scale} title="4. Derecho de retracto" accent="text-sky-400">
        <p>
          De acuerdo con la Ley 1480 de 2011 (Estatuto del Consumidor), el derecho de retracto aplicable
          a ventas a distancia no procede en contratos de suministro de contenido digital cuando la
          ejecución ha comenzado con el consentimiento previo y expreso del consumidor.
        </p>
        <p>
          Dado que SerenatIA entrega contenido digital personalizado que el usuario recibe, reproduce y
          puede descargar de forma inmediata al momento de la generación, el derecho de retracto no
          procede una vez la canción ha sido generada y entregada en el sitio.
        </p>
      </LegalSection>

      {/* 5. Cómo solicitar ayuda */}
      <LegalSection icon={MessageCircle} title="5. Cómo solicitar ayuda">
        <p>
          Escríbenos a <span className="text-purple-300 font-medium">soporte@serenatia.com</span> o por
          WhatsApp al <span className="text-purple-300 font-medium">+57 300 000 0000</span>, indicando
          tu código de acceso y describiendo el problema, dentro de las 48 horas siguientes a la
          generación de tu canción.
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
