export type Locale = 'en' | 'fr' | 'es' | 'pt' | 'ar';

export interface TranslationDictionary {
  navBrand: string;
  navSignIn: string;
  navDashboard: string;
  navAccount: string;
  navWelcome: string;
  tagline: string;
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
  btnGetOffer: string;
  btnHowItWorks: string;
  scanningText: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  footerText: string;
  modalTitle: string;
  modalSubtitle: string;
  modalStep1Title: string;
  modalStep1Desc: string;
  modalStep2Title: string;
  modalStep2Desc: string;
  modalStep3Title: string;
  modalStep3Desc: string;
  modalStep4Title: string;
  modalStep4Desc: string;
  modalStartSelling: string;
}

export const translations: Record<Locale, TranslationDictionary> = {
  en: {
    navBrand: "used4cash",
    navSignIn: "Sign In",
    navDashboard: "Dashboard",
    navAccount: "Account",
    navWelcome: "Welcome, ",
    tagline: "Don't trash it, cash it",
    heroTitle1: "Turn your old devices into",
    heroTitle2: "instant cash",
    heroSubtitle: "Turn your old electronics into instant cash. Get an AI-driven valuation in seconds and we'll pick it up within 24 hours.",
    btnGetOffer: "Get your offer",
    btnHowItWorks: "How it works",
    scanningText: "Scanning device condition...",
    feature1Title: "Instant AI Pricing",
    feature1Desc: "Our advanced agents analyze real-time market trends to offer you the most competitive payout instantly.",
    feature2Title: "Visual Diagnostics",
    feature2Desc: "Use your camera to let our Vision model assess the pristine condition of your device securely.",
    feature3Title: "White-glove Service",
    feature3Desc: "For complex devices, our certified engineers visit you within 24 hours to hand over the cash.",
    footerText: "© 2026 used4cash Marketplace. Don't trash it, cash it.",
    modalTitle: "The Marketplace Journey",
    modalSubtitle: "used4cash connects your device to a live network of verified vendors competing to give you the best price. No scams, no low-balls, just transparent bidding and data-driven payouts.",
    modalStep1Title: "1. The AI Assessment",
    modalStep1Desc: "Start by entering your device metadata. Our conversational AI agent will seamlessly guide you and request a visual diagnostic scan via your device camera to detect dents or scratches.",
    modalStep2Title: "2. Instant Valuation",
    modalStep2Desc: "Our Claude 3.5 Sonnet agent processes your inputs against live market data, depreciating standard wear and generating an instant, highly-competitive cash offer.",
    modalStep3Title: "3. Condition Logic & SLAs",
    modalStep3Desc: "If your device is in 'Mint' condition, we arrange a standard mail-in. If the condition is 'Poor' or 'Complex', the AI automatically dispatches a certified engineer to your location within 24 hours to securely verify the device and handover the cash.",
    modalStep4Title: "4. The Admin Command Center",
    modalStep4Desc: "Behind the scenes, our enterprise ticketing system tracks every SLA deadline ensuring you get paid and supported exactly on time.",
    modalStartSelling: "Start selling"
  },
  fr: {
    navBrand: "used4cash",
    navSignIn: "Se connecter",
    navDashboard: "Tableau de bord",
    navAccount: "Compte",
    navWelcome: "Bienvenue, ",
    tagline: "Ne le jetez pas, encaissez-le",
    heroTitle1: "Transformez vos anciens appareils en",
    heroTitle2: "argent instantané",
    heroSubtitle: "Transformez vos vieux appareils électroniques en argent instantané. Obtenez une estimation par IA en quelques secondes et nous les récupérons sous 24 heures.",
    btnGetOffer: "Obtenir votre offre",
    btnHowItWorks: "Comment ça marche",
    scanningText: "Analyse de l'état de l'appareil...",
    feature1Title: "Prix instantané par IA",
    feature1Desc: "Nos agents avancés analysent les tendances du marché en temps réel pour vous offrir le paiement le plus compétitif instantanément.",
    feature2Title: "Diagnostics visuels",
    feature2Desc: "Utilisez votre appareil photo pour laisser notre modèle de vision évaluer l'état impeccable de votre appareil en toute sécurité.",
    feature3Title: "Service haut de gamme",
    feature3Desc: "Pour les appareils complexes, nos ingénieurs certifiés se déplacent chez vous sous 24 heures pour vous remettre l'argent.",
    footerText: "© 2026 used4cash Marketplace. Ne le jetez pas, encaissez-le.",
    modalTitle: "Le parcours du marché",
    modalSubtitle: "used4cash connecte votre appareil à un réseau en direct de vendeurs vérifiés en compétition pour vous offrir le meilleur prix. Pas d'arnaques, juste des enchères transparentes et des paiements basés sur les données.",
    modalStep1Title: "1. L'évaluation par IA",
    modalStep1Desc: "Commencez par saisir les métadonnées de votre appareil. Notre agent d'IA conversationnel vous guidera et demandera une analyse de diagnostic visuel via votre caméra pour détecter les bosses ou les rayures.",
    modalStep2Title: "2. Évaluation instantanée",
    modalStep2Desc: "Notre agent Claude 3.5 Sonnet traite vos données par rapport aux données du marché en temps réel, appliquant la dépréciation standard de l'usure et générant une offre de rachat instantanée et hautement compétitive.",
    modalStep3Title: "3. Logique de condition et SLA",
    modalStep3Desc: "Si votre appareil est à l'état 'Neuf', nous organisons un envoi postal standard. Si l'état est 'Mauvais' ou 'Complexe', l'IA dépêche automatiquement un ingénieur certifié à votre adresse sous 24 heures pour vérifier l'appareil et vous remettre l'argent.",
    modalStep4Title: "4. Le centre de commande administrateur",
    modalStep4Desc: "Dans les coulisses, notre système de ticket d'entreprise suit chaque échéance pour vous garantir d'être payé et assisté exactement à temps.",
    modalStartSelling: "Commencer à vendre"
  },
  es: {
    navBrand: "used4cash",
    navSignIn: "Iniciar sesión",
    navDashboard: "Tablero",
    navAccount: "Cuenta",
    navWelcome: "Bienvenido, ",
    tagline: "No lo tires, cóbralo",
    heroTitle1: "Convierte tus viejos dispositivos en",
    heroTitle2: "efectivo al instante",
    heroSubtitle: "Convierte tus viejos aparatos electrónicos en efectivo al instante. Obtén una valoración impulsada por IA en segundos y lo recogeremos en 24 horas.",
    btnGetOffer: "Obtén tu oferta",
    btnHowItWorks: "Cómo funciona",
    scanningText: "Escaneando el estado del dispositivo...",
    feature1Title: "Precios instantáneos con IA",
    feature1Desc: "Nuestros agentes avanzados analizan las tendencias del mercado en tiempo real para ofrecerte el pago más competitivo al instante.",
    feature2Title: "Diagnóstico visual",
    feature2Desc: "Usa tu cámara para que nuestro modelo de visión evalúe el estado impecable de tu dispositivo de forma segura.",
    feature3Title: "Servicio de guante blanco",
    feature3Desc: "Para dispositivos complejos, nuestros ingenieros certificados te visitan en 24 horas para entregarte el efectivo.",
    footerText: "© 2026 used4cash Marketplace. No lo tires, cóbralo.",
    modalTitle: "El viaje del mercado",
    modalSubtitle: "used4cash conecta tu dispositivo a una red en vivo de vendedores verificados que compiten para darte el mejor precio. Sin estafas, solo ofertas transparentes y pagos basados en datos.",
    modalStep1Title: "1. La evaluación de IA",
    modalStep1Desc: "Comienza ingresando los metadatos de tu dispositivo. Nuestro agente conversacional de IA te guiará y solicitará un análisis de diagnóstico visual a través de tu cámara para detectar abolladuras o arañazos.",
    modalStep2Title: "2. Valoración instantánea",
    modalStep2Desc: "Nuestro agente Claude 3.5 Sonnet procesa tus datos frente a los del mercado en tiempo real, aplicando la depreciación estándar por desgaste y generando una oferta de efectivo instantánea y muy competitiva.",
    modalStep3Title: "3. Lógica de condición y SLA",
    modalStep3Desc: "Si tu dispositivo está en estado 'Excelente', organizamos un envío estándar. Si está en mal estado o es complejo, la IA envía automáticamente a un ingeniero certificado a tu ubicación en 24 horas para verificarlo y entregarte el dinero.",
    modalStep4Title: "4. El centro de comando del administrador",
    modalStep4Desc: "Detrás de escena, nuestro sistema de tickets empresarial realiza un seguimiento de cada plazo de SLA para garantizar que recibas tu pago y soporte a tiempo.",
    modalStartSelling: "Empezar a vender"
  },
  pt: {
    navBrand: "used4cash",
    navSignIn: "Entrar",
    navDashboard: "Painel",
    navAccount: "Conta",
    navWelcome: "Bem-vindo, ",
    tagline: "Não jogue fora, fature",
    heroTitle1: "Transforme seus aparelhos antigos em",
    heroTitle2: "dinheiro imediato",
    heroSubtitle: "Transforme seus eletrônicos antigos em dinheiro imediato. Obtenha uma avaliação por IA em segundos e nós coletamos em 24 horas.",
    btnGetOffer: "Obter sua oferta",
    btnHowItWorks: "Como funciona",
    scanningText: "Analisando o estado do aparelho...",
    feature1Title: "Preço imediato por IA",
    feature1Desc: "Nossos agentes avançados analisam as tendências do mercado em tempo real para oferecer o pagamento mais competitivo na hora.",
    feature2Title: "Diagnóstico visual",
    feature2Desc: "Use sua câmera para que nosso modelo de visão avalie o estado impecável do seu aparelho com segurança.",
    feature3Title: "Serviço premium",
    feature3Desc: "Para aparelhos complexos, nossos engenheiros certificados visitam você em até 24 horas para entregar o dinheiro.",
    footerText: "© 2026 used4cash Marketplace. Não jogue fora, fature.",
    modalTitle: "A jornada do marketplace",
    modalSubtitle: "used4cash conecta seu dispositivo a uma rede ao vivo de vendedores verificados competindo para lhe dar o melhor preço. Sem golpes, apenas lances transparentes e pagamentos baseados em dados.",
    modalStep1Title: "1. A avaliação por IA",
    modalStep1Desc: "Comece inserindo os metadados do seu aparelho. Nosso agente de IA conversacional guiará você e solicitará uma análise visual pela câmera para detectar amassados ou arranhões.",
    modalStep2Title: "2. Avaliação imediata",
    modalStep2Desc: "Nosso agente Claude 3.5 Sonnet processa suas informações com base nos dados do mercado em tempo real, calculando o desgaste padrão e gerando uma oferta imediata e altamente competitiva.",
    modalStep3Title: "3. Lógica de condições e SLAs",
    modalStep3Desc: "Se o seu aparelho estiver em estado de 'Novo', organizamos o envio padrão. Se o estado for 'Ruim' ou 'Complexo', a IA despacha automaticamente um engenheiro certificado até você em 24 horas para verificar o aparelho e entregar o dinheiro.",
    modalStep4Title: "4. O centro de comando administrativo",
    modalStep4Desc: "Nos bastidores, nosso sistema empresarial de tickets rastreia todos os prazos de SLAs para garantir que você receba o pagamento e o suporte no tempo exato.",
    modalStartSelling: "Começar a vender"
  },
  ar: {
    navBrand: "used4cash",
    navSignIn: "تسجيل الدخول",
    navDashboard: "لوحة التحكم",
    navAccount: "الحساب",
    navWelcome: "مرحباً، ",
    tagline: "لا ترميها، كيشها",
    heroTitle1: "حوّل أجهزتك القديمة إلى",
    heroTitle2: "كاش فوري",
    heroSubtitle: "حوّل إلكترونياتك القديمة إلى كاش فوري. احصل على تقييم فوري مدعوم بالذكاء الاصطناعي في ثوانٍ وسنقوم باستلامها خلال 24 ساعة.",
    btnGetOffer: "احصل على عرضك",
    btnHowItWorks: "كيف يعمل",
    scanningText: "جاري فحص حالة الجهاز...",
    feature1Title: "تسعير فوري بالذكاء الاصطناعي",
    feature1Desc: "تقوم وكلاؤنا المتقدمون بتحليل اتجاهات السوق في الوقت الفعلي لنقدم لك أفضل قيمة دفع فوري ومنافس.",
    feature2Title: "التشخيص البصري",
    feature2Desc: "استخدم الكاميرا لتمكين نموذج الرؤية الخاص بنا من تقييم الحالة الجيدة لجهازك بشكل آمن.",
    feature3Title: "خدمة راقية متكاملة",
    feature3Desc: "للأجهزة المعقدة، يقوم مهندسونا المعتمدون بزيارتك في غضون 24 ساعة لتسليم الكاش يداً بيد.",
    footerText: "© 2026 سوق used4cash. لا ترميها، كيشها.",
    modalTitle: "رحلة البيع في السوق",
    modalSubtitle: "يربط used4cash جهازك بشبكة حية من البائعين المعتمدين الذين يتنافسون لتقديم أفضل سعر لك. لا احتيال، لا تبخيس للأسعار، فقط مزايدة شفافة ومدفوعات مبنية على البيانات.",
    modalStep1Title: "١. التقييم بالذكاء الاصطناعي",
    modalStep1Desc: "ابدأ بإدخال بيانات جهازك. سيقوم وكيلنا الحواري المدعوم بالذكاء الاصطناعي بتوجيهك بسلاسة وطلب فحص تشخيصي مرئي عبر الكاميرا الخاصة بك للكشف عن أي صدمات أو خدوش.",
    modalStep2Title: "٢. تقييم فوري للأسعار",
    modalStep2Desc: "يقوم وكيلنا المعتمد على نموذج Claude 3.5 Sonnet بمعالجة بياناتك ومطابقتها ببيانات السوق الحية، مع احتساب الإهلاك الطبيعي للاستخدام وتوليد عرض كاش فوري وتنافسي للغاية.",
    modalStep3Title: "٣. حالة الأجهزة واتفاقيات الخدمة",
    modalStep3Desc: "إذا كان جهازك في حالة 'ممتازة'، نقوم بترتيب شحن قياسي. أما إذا كانت الحالة 'سيئة' أو 'معقدة'، فإن الذكاء الاصطناعي يرسل تلقائياً مهندساً معتمداً لموقعك في غضون ٢٤ ساعة لفحص الجهاز وتسليم الكاش.",
    modalStep4Title: "٤. مركز التحكم الإداري",
    modalStep4Desc: "خلف الكواليس، يتتبع نظام التذاكر المؤسسي لدينا كل موعد نهائي لضمان حصولك على الدفع والدعم في الوقت المحدد تماماً.",
    modalStartSelling: "ابدأ البيع الآن"
  }
};
