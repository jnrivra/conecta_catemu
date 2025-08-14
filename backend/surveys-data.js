// Datos de encuestas municipales realistas
const surveys = [
  {
    id: 1,
    title: "Evaluación de Servicios Municipales 2025",
    description: "Ayúdanos a mejorar evaluando la calidad de nuestros servicios municipales",
    category: "servicios",
    estimated_time: "3 minutos",
    priority: "alta",
    active: true,
    questions: [
      {
        id: 1,
        type: "rating",
        question: "¿Cómo calificaría la atención recibida en las oficinas municipales?",
        options: ["1", "2", "3", "4", "5"],
        required: false
      },
      {
        id: 2,
        type: "multiple",
        question: "¿Qué servicios municipales ha utilizado en los últimos 6 meses?",
        options: [
          "Licencias de conducir",
          "Permisos de construcción",
          "Pago de patentes",
          "Atención social",
          "Oficina de partes",
          "Registro civil",
          "Otros"
        ],
        required: false
      },
      {
        id: 3,
        type: "rating",
        question: "¿Qué tan satisfecho está con el tiempo de respuesta a sus solicitudes?",
        options: ["Muy insatisfecho", "Insatisfecho", "Neutral", "Satisfecho", "Muy satisfecho"],
        required: false
      },
      {
        id: 4,
        type: "text",
        question: "¿Qué aspectos mejoraría de la atención municipal?",
        placeholder: "Comparta sus sugerencias...",
        required: false
      },
      {
        id: 5,
        type: "single",
        question: "¿Recomendaría los servicios municipales a otros vecinos?",
        options: ["Definitivamente sí", "Probablemente sí", "No estoy seguro", "Probablemente no", "Definitivamente no"],
        required: false
      }
    ]
  },
  {
    id: 2,
    title: "Plan de Seguridad Ciudadana",
    description: "Tu opinión es fundamental para diseñar estrategias de seguridad efectivas",
    category: "seguridad",
    estimated_time: "5 minutos",
    priority: "alta",
    active: true,
    questions: [
      {
        id: 1,
        type: "single",
        question: "¿Cómo percibe el nivel de seguridad en su barrio?",
        options: ["Muy seguro", "Seguro", "Regular", "Inseguro", "Muy inseguro"],
        required: false
      },
      {
        id: 2,
        type: "multiple",
        question: "¿Qué problemas de seguridad son más frecuentes en su sector?",
        options: [
          "Robos a viviendas",
          "Asaltos en la vía pública",
          "Consumo de drogas",
          "Riñas callejeras",
          "Ruidos molestos",
          "Perros vagos",
          "Vehículos mal estacionados",
          "Ninguno de los anteriores"
        ],
        required: false
      },
      {
        id: 3,
        type: "single",
        question: "¿Su sector cuenta con iluminación pública adecuada?",
        options: ["Sí, completamente", "Parcialmente", "No, es insuficiente"],
        required: false
      },
      {
        id: 4,
        type: "multiple",
        question: "¿Qué medidas de seguridad considera más necesarias?",
        options: [
          "Más patrullaje policial",
          "Cámaras de seguridad",
          "Mejor iluminación",
          "Alarmas comunitarias",
          "Programas de prevención",
          "Recuperación de espacios públicos"
        ],
        required: false
      },
      {
        id: 5,
        type: "text",
        question: "¿Qué lugares específicos de su barrio requieren mayor atención en seguridad?",
        placeholder: "Indique calles, plazas o sectores específicos...",
        required: false
      },
      {
        id: 6,
        type: "single",
        question: "¿Estaría dispuesto a participar en un comité de seguridad vecinal?",
        options: ["Sí", "No", "Tal vez"],
        required: false
      }
    ]
  },
  {
    id: 3,
    title: "Transporte y Movilidad Comunal",
    description: "Queremos conocer tus necesidades de transporte para mejorar la conectividad",
    category: "transporte",
    estimated_time: "4 minutos",
    priority: "media",
    active: true,
    questions: [
      {
        id: 1,
        type: "single",
        question: "¿Cuál es su principal medio de transporte?",
        options: [
          "Vehículo particular",
          "Transporte público",
          "Bicicleta",
          "Caminata",
          "Motocicleta",
          "Otro"
        ],
        required: false
      },
      {
        id: 2,
        type: "rating",
        question: "¿Cómo califica el estado de las calles y veredas en su sector?",
        options: ["1", "2", "3", "4", "5"],
        required: false
      },
      {
        id: 3,
        type: "multiple",
        question: "¿Qué problemas de transporte enfrenta frecuentemente?",
        options: [
          "Falta de locomoción colectiva",
          "Mal estado de calles",
          "Falta de señalización",
          "Congestión vehicular",
          "Falta de ciclovías",
          "Veredas en mal estado",
          "Falta de paraderos",
          "Iluminación insuficiente"
        ],
        required: false
      },
      {
        id: 4,
        type: "single",
        question: "¿Con qué frecuencia necesita desplazarse fuera de Catemu?",
        options: ["Diariamente", "Semanalmente", "Mensualmente", "Ocasionalmente"],
        required: false
      },
      {
        id: 5,
        type: "text",
        question: "¿Qué rutas o conexiones de transporte considera prioritarias?",
        placeholder: "Ejemplo: Catemu - San Felipe, más frecuencia en horario punta...",
        required: false
      }
    ]
  },
  {
    id: 4,
    title: "Actividades Culturales y Deportivas",
    description: "Ayúdanos a planificar actividades que sean de tu interés",
    category: "cultura",
    estimated_time: "3 minutos",
    priority: "media",
    active: true,
    questions: [
      {
        id: 1,
        type: "multiple",
        question: "¿Qué tipo de actividades culturales le interesan?",
        options: [
          "Conciertos y música en vivo",
          "Teatro y artes escénicas",
          "Ferias artesanales",
          "Exposiciones de arte",
          "Talleres y cursos",
          "Cine al aire libre",
          "Festivales gastronómicos",
          "Celebraciones tradicionales"
        ],
        required: false
      },
      {
        id: 2,
        type: "multiple",
        question: "¿Qué actividades deportivas le gustaría que se promovieran?",
        options: [
          "Fútbol",
          "Básquetbol",
          "Voleibol",
          "Ciclismo",
          "Running/Maratones",
          "Gimnasia para adultos mayores",
          "Yoga/Pilates",
          "Deportes infantiles",
          "Natación"
        ],
        required: false
      },
      {
        id: 3,
        type: "single",
        question: "¿Cuál es el mejor horario para que usted participe en actividades?",
        options: [
          "Mañana (8:00 - 12:00)",
          "Tarde (14:00 - 18:00)",
          "Noche (19:00 - 22:00)",
          "Fines de semana"
        ],
        required: false
      },
      {
        id: 4,
        type: "single",
        question: "¿Participaría en talleres gratuitos organizados por el municipio?",
        options: ["Sí, definitivamente", "Probablemente", "No estoy seguro", "No"],
        required: false
      },
      {
        id: 5,
        type: "text",
        question: "¿Qué otras actividades le gustaría que organizara la municipalidad?",
        placeholder: "Comparta sus ideas...",
        required: false
      }
    ]
  },
  {
    id: 5,
    title: "Medio Ambiente y Áreas Verdes",
    description: "Tu opinión nos ayudará a cuidar mejor nuestro entorno",
    category: "medioambiente",
    estimated_time: "4 minutos",
    priority: "alta",
    active: true,
    questions: [
      {
        id: 1,
        type: "rating",
        question: "¿Cómo evalúa el estado de las áreas verdes en su sector?",
        options: ["1", "2", "3", "4", "5"],
        required: false
      },
      {
        id: 2,
        type: "single",
        question: "¿Con qué frecuencia visita plazas o parques de la comuna?",
        options: [
          "Diariamente",
          "Varias veces a la semana",
          "Semanalmente",
          "Mensualmente",
          "Casi nunca"
        ],
        required: false
      },
      {
        id: 3,
        type: "multiple",
        question: "¿Qué problemas ambientales considera más urgentes en Catemu?",
        options: [
          "Contaminación del aire",
          "Manejo de basura",
          "Falta de reciclaje",
          "Escasez de agua",
          "Ruido excesivo",
          "Microbasurales",
          "Falta de áreas verdes",
          "Tenencia irresponsable de mascotas"
        ],
        required: false
      },
      {
        id: 4,
        type: "single",
        question: "¿Separa sus residuos para reciclaje en su hogar?",
        options: [
          "Sí, siempre",
          "A veces",
          "No, pero me gustaría",
          "No, no me interesa"
        ],
        required: false
      },
      {
        id: 5,
        type: "multiple",
        question: "¿Qué iniciativas ambientales apoyaría?",
        options: [
          "Puntos de reciclaje",
          "Compostaje comunitario",
          "Huertos urbanos",
          "Jornadas de limpieza",
          "Educación ambiental",
          "Ferias de intercambio",
          "Adopción de espacios verdes"
        ],
        required: false
      },
      {
        id: 6,
        type: "text",
        question: "¿Qué sugerencias tiene para mejorar el cuidado del medio ambiente en Catemu?",
        placeholder: "Sus ideas son importantes...",
        required: false
      }
    ]
  },
  {
    id: 6,
    title: "Vivienda y Desarrollo Urbano",
    description: "Comparte tus necesidades habitacionales y de desarrollo urbano",
    category: "vivienda",
    estimated_time: "3 minutos",
    priority: "alta",
    active: true,
    questions: [
      {
        id: 1,
        type: "single",
        question: "¿Cuál es su situación habitacional actual?",
        options: [
          "Propietario",
          "Arrendatario",
          "Allegado",
          "Vivienda cedida",
          "Otro"
        ],
        required: false
      },
      {
        id: 2,
        type: "single",
        question: "¿Cómo evalúa la calidad de su vivienda?",
        options: [
          "Excelente",
          "Buena",
          "Regular",
          "Mala",
          "Muy mala"
        ],
        required: false
      },
      {
        id: 3,
        type: "multiple",
        question: "¿Qué servicios básicos necesita mejorar en su sector?",
        options: [
          "Agua potable",
          "Alcantarillado",
          "Electricidad",
          "Gas",
          "Internet",
          "Pavimentación",
          "Alumbrado público"
        ],
        required: false
      },
      {
        id: 4,
        type: "single",
        question: "¿Estaría interesado en programas de mejoramiento de vivienda?",
        options: [
          "Sí, muy interesado",
          "Sí, algo interesado",
          "No estoy seguro",
          "No me interesa"
        ],
        required: false
      },
      {
        id: 5,
        type: "text",
        question: "¿Qué aspectos de desarrollo urbano considera prioritarios para su barrio?",
        placeholder: "Comparta sus prioridades...",
        required: false
      }
    ]
  }
];

module.exports = surveys;