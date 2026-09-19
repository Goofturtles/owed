/* ============================================================
   Owed — catalog of categories, brands, payment methods, regions
   Shared by the landing page teaser and the app.
   ============================================================ */
(function (global) {
  'use strict';

  var i18n = global.OwedI18n;

  // ids never change; labels are in the visitor's language; keywords are the English words people type
  var CATEGORIES = [
    { id: 'phone',           key: 'catalog.category.phone', label: i18n.t('catalog.category.phone'),          keywords: ['phone', 'iphone', 'pixel', 'galaxy', 'smartphone', 'mobile'] },
    { id: 'laptop',          key: 'catalog.category.laptop', label: i18n.t('catalog.category.laptop'),         keywords: ['laptop', 'macbook', 'notebook', 'computer', 'pc', 'desktop', 'chromebook'] },
    { id: 'tablet',          key: 'catalog.category.tablet', label: i18n.t('catalog.category.tablet'),         keywords: ['tablet', 'ipad', 'kindle', 'e-reader', 'surface'] },
    { id: 'headphones',      key: 'catalog.category.headphones', label: i18n.t('catalog.category.headphones'),     keywords: ['headphone', 'headphones', 'earbud', 'earbuds', 'airpod', 'airpods', 'earphone', 'buds', 'headset'] },
    { id: 'tv',              key: 'catalog.category.tv', label: i18n.t('catalog.category.tv'),             keywords: ['tv', 'television', 'display', 'screen'] },
    { id: 'console',         key: 'catalog.category.console', label: i18n.t('catalog.category.console'),        keywords: ['console', 'playstation', 'ps5', 'xbox', 'switch', 'controller'] },
    { id: 'camera',          key: 'catalog.category.camera', label: i18n.t('catalog.category.camera'),         keywords: ['camera', 'lens', 'dslr', 'mirrorless', 'gopro'] },
    { id: 'watch',           key: 'catalog.category.watch', label: i18n.t('catalog.category.watch'),          keywords: ['watch', 'smartwatch', 'fitbit', 'tracker', 'garmin'] },
    { id: 'appliance-large', key: 'catalog.category.applianceLarge', label: i18n.t('catalog.category.applianceLarge'), keywords: ['fridge', 'refrigerator', 'freezer', 'washer', 'washing machine', 'dryer', 'dishwasher', 'oven', 'stove', 'range', 'furnace', 'water heater'] },
    { id: 'appliance-small', key: 'catalog.category.applianceSmall', label: i18n.t('catalog.category.applianceSmall'), keywords: ['kettle', 'toaster', 'microwave', 'blender', 'coffee', 'espresso', 'mixer', 'air fryer', 'fryer', 'iron', 'humidifier', 'fan', 'heater'] },
    { id: 'vacuum',          key: 'catalog.category.vacuum', label: i18n.t('catalog.category.vacuum'),         keywords: ['vacuum', 'hoover', 'roomba', 'dyson'] },
    { id: 'kitchen',         key: 'catalog.category.kitchen', label: i18n.t('catalog.category.kitchen'),        keywords: ['pan', 'pot', 'cookware', 'skillet', 'cast iron', 'knife', 'knives', 'cutlery', 'bakeware'] },
    { id: 'power-tool',      key: 'catalog.category.powerTool', label: i18n.t('catalog.category.powerTool'),      keywords: ['drill', 'saw', 'tool', 'sander', 'grinder', 'mower', 'trimmer', 'wrench', 'screwdriver'] },
    { id: 'furniture',       key: 'catalog.category.furniture', label: i18n.t('catalog.category.furniture'),      keywords: ['chair', 'desk', 'sofa', 'couch', 'table', 'shelf', 'bookcase', 'furniture'] },
    { id: 'mattress',        key: 'catalog.category.mattress', label: i18n.t('catalog.category.mattress'),       keywords: ['mattress', 'bed', 'pillow', 'duvet'] },
    { id: 'footwear',        key: 'catalog.category.footwear', label: i18n.t('catalog.category.footwear'),       keywords: ['shoe', 'shoes', 'boot', 'boots', 'sneaker', 'sneakers', 'trainers', 'sandal'] },
    { id: 'apparel',         key: 'catalog.category.apparel', label: i18n.t('catalog.category.apparel'),        keywords: ['jacket', 'coat', 'shirt', 'trousers', 'pants', 'clothing', 'sock', 'socks', 'fleece', 'hoodie'] },
    { id: 'bag',             key: 'catalog.category.bag', label: i18n.t('catalog.category.bag'),            keywords: ['bag', 'backpack', 'rucksack', 'luggage', 'suitcase', 'duffel', 'purse', 'wallet'] },
    { id: 'bike',            key: 'catalog.category.bike', label: i18n.t('catalog.category.bike'),           keywords: ['bike', 'bicycle', 'scooter', 'ebike', 'e-bike'] },
    { id: 'outdoor',         key: 'catalog.category.outdoor', label: i18n.t('catalog.category.outdoor'),        keywords: ['tent', 'sleeping bag', 'stove', 'backpacking', 'camping', 'kayak', 'ski', 'snowboard'] },
    { id: 'printer',         key: 'catalog.category.printer', label: i18n.t('catalog.category.printer'),        keywords: ['printer', 'scanner', 'ink'] },
    { id: 'toy',             key: 'catalog.category.toy', label: i18n.t('catalog.category.toy'),            keywords: ['toy', 'stroller', 'pushchair', 'car seat', 'crib', 'lego'] },
    // not tiles: only picked from the words. A monitor has its own warranties, and a TV's are not its
    { id: 'monitor',         key: 'catalog.category.monitor', label: i18n.t('catalog.category.monitor'),        keywords: ['monitor', 'computer screen', 'gaming screen'] },
    // ("my car", "Honda truck"), so car recalls stop showing for everything else
    { id: 'vehicle',         key: 'catalog.category.vehicle', label: i18n.t('catalog.category.vehicle'),        keywords: ['car ', 'my car', 'vehicle', 'truck', 'suv', 'minivan', 'tyre', 'tyres', 'tires', 'motorcycle', 'airbag', 'trailer'] },
    { id: 'other',           key: 'catalog.category.other', label: i18n.t('catalog.category.other'),          keywords: [] }
  ];

  /* i18n-data: the words French and Spanish speakers type for each category, beside the
     English keywords above. Written as people spell them: case, accents and hyphens are
     ignored, and each must stand as a whole word, so "panne" is never a "pan". A French or
     Spanish visitor is matched on their language's words first, then on the English ones
     (whole words too: "iPhone", "AirPods" and "laptop" are typed in every language). */
  var KEYWORDS = {
    fr: {
      'phone':           ['téléphone', 'téléphone portable', 'téléphone intelligent', 'cellulaire', 'cell'],
      'laptop':          ['ordinateur', 'ordinateur portable', 'ordinateur de bureau', 'ordi'],
      'tablet':          ['tablette', 'tablette tactile', 'liseuse'],
      'headphones':      ['casque', 'casque audio', 'casque d’écoute', 'écouteur', 'écouteurs', 'oreillette', 'oreillettes'],
      'tv':              ['télé', 'téléviseur', 'télévision', 'écran', 'moniteur'],
      'console':         ['console de jeux', 'console de jeu', 'manette'],
      'camera':          ['appareil photo', 'caméra', 'caméscope', 'reflex'],
      'watch':           ['montre', 'montre connectée', 'bracelet connecté'],
      'appliance-large': ['réfrigérateur', 'frigo', 'frigidaire', 'congélateur', 'lave-linge', 'machine à laver', 'laveuse',
                          'sèche-linge', 'sécheuse', 'lave-vaisselle', 'four', 'cuisinière', 'table de cuisson',
                          'plaque de cuisson', 'chauffe-eau', 'fournaise', 'chaudière'],
      'appliance-small': ['bouilloire', 'grille-pain', 'micro-ondes', 'mélangeur', 'mixeur', 'cafetière', 'machine à café',
                          'machine à espresso', 'friteuse', 'friteuse à air', 'fer à repasser', 'humidificateur',
                          'ventilateur', 'radiateur', 'chaufferette', 'robot culinaire', 'robot de cuisine', 'mijoteuse'],
      'vacuum':          ['aspirateur', 'aspirateur robot', 'robot aspirateur', 'balayeuse'],
      'kitchen':         ['poêle', 'poêle en fonte', 'casserole', 'marmite', 'cocotte', 'cocotte en fonte',
                          'batterie de cuisine', 'couteau', 'couteaux', 'ustensiles de cuisine'],
      'power-tool':      ['perceuse', 'perceuse sans fil', 'visseuse', 'scie', 'ponceuse', 'meuleuse', 'tondeuse',
                          'taille-haie', 'coupe-bordure', 'tronçonneuse', 'souffleuse', 'outil', 'outils', 'outil électrique'],
      'furniture':       ['chaise', 'chaise de bureau', 'fauteuil', 'bureau', 'canapé', 'divan', 'table', 'étagère',
                          'bibliothèque', 'meuble', 'meubles', 'commode', 'armoire'],
      'mattress':        ['matelas', 'surmatelas', 'sommier', 'oreiller', 'couette', 'literie'],
      'footwear':        ['chaussure', 'chaussures', 'soulier', 'souliers', 'botte', 'bottes', 'bottine', 'bottines',
                          'baskets', 'espadrilles', 'sandale', 'sandales'],
      'apparel':         ['vêtement', 'vêtements', 'veste', 'manteau', 'blouson', 'parka', 'chemise', 'pantalon',
                          'pantalons', 'jeans', 'chaussette', 'chaussettes', 'polaire', 'chandail', 'sweat'],
      'bag':             ['sac', 'sac à dos', 'sac à main', 'sacoche', 'valise', 'bagage', 'bagages', 'portefeuille', 'porte-monnaie'],
      'bike':            ['vélo', 'vélo électrique', 'bicyclette', 'trottinette', 'trottinette électrique', 'casque de vélo'],
      'outdoor':         ['tente', 'sac de couchage', 'réchaud', 'camping', 'planche à neige', 'casque de ski'],
      'printer':         ['imprimante', 'numériseur', 'scanneur', 'encre', 'cartouche'],
      'toy':             ['jouet', 'jouets', 'poussette', 'siège auto', 'siège d’auto', 'lit de bébé', 'berceau', 'table à langer']
    },
    es: {
      'phone':           ['teléfono', 'teléfono móvil', 'móvil', 'celular'],
      'laptop':          ['portátil', 'ordenador', 'ordenador portátil', 'computadora', 'computadora portátil', 'computador'],
      'tablet':          ['tableta', 'libro electrónico', 'lector de libros electrónicos'],
      'headphones':      ['auricular', 'auriculares', 'audífono', 'audífonos', 'cascos'],
      'tv':              ['tele', 'televisor', 'televisión'],
      'console':         ['consola', 'videoconsola'],
      'camera':          ['cámara', 'cámara de fotos', 'videocámara', 'réflex'],
      'watch':           ['reloj', 'reloj inteligente', 'pulsera de actividad', 'pulsera inteligente'],
      'appliance-large': ['nevera', 'refrigerador', 'refrigeradora', 'frigorífico', 'heladera', 'congelador', 'lavadora',
                          'secadora', 'lavavajillas', 'lavaplatos', 'horno', 'vitrocerámica', 'calentador de agua', 'caldera'],
      'appliance-small': ['hervidor', 'hervidor de agua', 'tostadora', 'tostador', 'microondas', 'licuadora', 'batidora',
                          'cafetera', 'máquina de café', 'freidora', 'freidora de aire', 'plancha', 'humidificador',
                          'ventilador', 'calefactor', 'robot de cocina', 'olla eléctrica'],
      'vacuum':          ['aspiradora', 'aspirador', 'robot aspirador', 'robot aspiradora'],
      'kitchen':         ['sartén', 'olla', 'cacerola', 'cazo', 'cuchillo', 'cuchillos', 'cubiertos', 'batería de cocina',
                          'hierro fundido', 'bandeja de horno'],
      'power-tool':      ['taladro', 'taladro inalámbrico', 'atornillador', 'destornillador', 'sierra', 'motosierra',
                          'lijadora', 'amoladora', 'esmeriladora', 'cortacésped', 'cortadora de césped', 'podadora',
                          'desbrozadora', 'herramienta', 'herramientas', 'herramienta eléctrica'],
      'furniture':       ['silla', 'silla de oficina', 'sillón', 'escritorio', 'sofá', 'mesa', 'estantería', 'estante',
                          'librero', 'mueble', 'muebles', 'armario'],
      'mattress':        ['colchón', 'somier', 'almohada', 'edredón', 'cama', 'ropa de cama'],
      'footwear':        ['zapato', 'zapatos', 'zapatilla', 'zapatillas', 'bota', 'botas', 'botines', 'tenis',
                          'deportivas', 'sandalia', 'sandalias'],
      'apparel':         ['ropa', 'chaqueta', 'chamarra', 'campera', 'abrigo', 'camisa', 'camiseta', 'playera',
                          'pantalón', 'pantalones', 'calcetín', 'calcetines', 'sudadera', 'forro polar'],
      'bag':             ['bolso', 'bolsa', 'mochila', 'maleta', 'equipaje', 'cartera', 'billetera'],
      'bike':            ['bici', 'bicicleta', 'bicicleta eléctrica', 'patinete', 'patinete eléctrico', 'monopatín'],
      'outdoor':         ['tienda de campaña', 'carpa', 'saco de dormir', 'bolsa de dormir', 'hornillo', 'esquí', 'tabla de snowboard'],
      'printer':         ['impresora', 'escáner', 'tinta', 'cartucho'],
      'toy':             ['juguete', 'juguetes', 'carriola', 'cochecito', 'silla de auto', 'silla de coche',
                          'asiento de coche', 'cuna', 'portabebés']
    }
  };

  /* i18n-data: brand names that are everyday words in a language, so typing them names no brand
     there ("mon frigidaire" is any fridge). */
  var NOT_BRANDS = { fr: ['Frigidaire'] };

  var BRANDS = [
    'Apple', 'Samsung', 'Google', 'Sony', 'Bose', 'Sennheiser', 'JBL', 'Anker', 'Beats',
    'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft', 'Razer', 'LG', 'TCL', 'Hisense',
    'Nintendo', 'Canon', 'Nikon', 'Fujifilm', 'GoPro', 'Garmin', 'Fitbit', 'Casio',
    'Whirlpool', 'GE', 'Bosch', 'Miele', 'Samsung Home', 'Frigidaire', 'Maytag', 'Electrolux',
    'Dyson', 'Shark', 'iRobot', 'Ninja', 'Instant Pot', 'Breville', 'KitchenAid', 'Cuisinart',
    'De’Longhi', 'Nespresso', 'Keurig', 'SodaStream',
    'Lodge', 'Le Creuset', 'All-Clad', 'Zwilling', 'Victorinox',
    'DeWalt', 'Makita', 'Milwaukee', 'Bosch Tools', 'Ryobi', 'Stanley', 'Craftsman', 'Snap-on',
    'IKEA', 'Herman Miller', 'Steelcase', 'Casper', 'Purple',
    'Nike', 'Adidas', 'New Balance', 'Dr. Martens', 'Blundstone', 'Timberland',
    'Patagonia', 'The North Face', 'Arc’teryx', 'Columbia', 'Carhartt', 'Darn Tough',
    'Osprey', 'JanSport', 'Samsonite', 'Away', 'Herschel',
    'Trek', 'Specialized', 'Giant', 'Brompton',
    'Peloton', 'Bowflex', 'Segway', 'Xiaomi', 'OnePlus', 'Motorola', 'Nothing', 'Other'
  ];

  var PAYMENTS = [
    { id: 'visa',       label: i18n.t('catalog.payment.visa') },
    { id: 'mastercard', label: i18n.t('catalog.payment.mastercard') },
    { id: 'amex',       label: 'American Express' },
    { id: 'discover',   label: 'Discover' },
    { id: 'debit',      label: i18n.t('catalog.payment.debit') },
    { id: 'cash',       label: i18n.t('catalog.payment.cash') },
    { id: 'unknown',    label: i18n.t('catalog.payment.unknown') }
  ];

  var REGIONS = [
    { id: 'US', label: i18n.t('catalog.region.us') },
    { id: 'CA', label: i18n.t('catalog.region.ca') },
    { id: 'MX', label: i18n.t('catalog.region.mx') },
    { id: 'UK', label: i18n.t('catalog.region.uk') },
    { id: 'EU', label: i18n.t('catalog.region.eu') }
  ];

  var AGES = [
    { id: 3,   label: i18n.t('catalog.age.months3') },
    { id: 9,   label: i18n.t('catalog.age.months9') },
    { id: 14,  label: i18n.t('catalog.age.months14') },
    { id: 22,  label: i18n.t('catalog.age.months22') },
    { id: 34,  label: i18n.t('catalog.age.months34') },
    { id: 60,  label: i18n.t('catalog.age.months60') },
    { id: 96,  label: i18n.t('catalog.age.months96') }
  ];

  /* ---- matching what people type, in French and Spanish ----
     Lower-cased, accents and hyphens dropped, curly apostrophes made straight,
     so "Lave-Linge", "lave linge" and "lave-linge" read the same. */
  function fold(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\u2019/g, '\'').replace(/[\s-]+/g, ' ');
  }

  var LETTER = /\p{L}/u;

  /** word appears in text with no letter touching either end ("four" is not in "fournaise") */
  function hasWord(text, word) {
    if (!word) return false;
    for (var i = text.indexOf(word); i !== -1; i = text.indexOf(word, i + 1)) {
      if (!LETTER.test(text.charAt(i - 1)) && !LETTER.test(text.charAt(i + word.length))) return true;
    }
    return false;
  }

  /**
   * Guess a category from free text. Returns a category id or null.
   * Longest keyword wins so "cast iron" beats "iron".
   */
  function guessCategory(text) {
    if (!text) return null;
    var best = null;
    var bestLen = 0;
    var local = KEYWORDS[i18n.lang];
    if (!local) {
      var t = String(text).toLowerCase();
      CATEGORIES.forEach(function (cat) {
        cat.keywords.forEach(function (kw) {
          if (t.indexOf(kw) !== -1 && kw.length > bestLen) {
            best = cat.id;
            bestLen = kw.length;
          }
        });
      });
      return best;
    }
    // French or Spanish: the language's own words, then the English ones, all as whole words;
    // on a tie the language's own word wins
    var f = fold(text);
    [function (cat) { return local[cat.id] || []; }, function (cat) { return cat.keywords; }].forEach(function (wordsFor) {
      CATEGORIES.forEach(function (cat) {
        wordsFor(cat).forEach(function (kw) {
          var k = fold(kw);
          // whole words, plus a plural in -s ("iphones", "écouteurs") that a whole-word match would miss
          if (k.length > bestLen && (hasWord(f, k) || hasWord(f, k + 's'))) {
            best = cat.id;
            bestLen = k.length;
          }
        });
      });
    });
    return best;
  }

  /** Guess a brand from free text. Returns the brand name or null. */
  function guessBrand(text) {
    if (!text) return null;
    var t = String(text).toLowerCase();
    var best = null;
    var bestLen = 0;
    // French or Spanish: whole words only, so "remplacer" is not an Acer and "rouge" not a GE
    var whole = i18n.lang !== 'en';
    var f = whole ? fold(text) : '';
    var skip = NOT_BRANDS[i18n.lang] || [];
    BRANDS.forEach(function (b) {
      var lb = b.toLowerCase();
      if (lb === 'other') return;
      if (whole) {
        if (skip.indexOf(b) !== -1) return;
        lb = fold(b);
        if (lb.length > bestLen && hasWord(f, lb)) {
          best = b;
          bestLen = lb.length;
        }
        return;
      }
      if (t.indexOf(lb) !== -1 && lb.length > bestLen) {
        best = b;
        bestLen = lb.length;
      }
    });
    return best;
  }

  /** code: the language to name it in (default: the page's; the on-device model is prompted in 'en'). */
  function categoryLabel(id, code) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) {
        // ids are hyphenated (appliance-large), keys are not (applianceLarge): use the entry's own key
        return code && code !== i18n.lang ? i18n.tIn(code, CATEGORIES[i].key) : CATEGORIES[i].label;
      }
    }
    return code && code !== i18n.lang ? i18n.tIn(code, 'catalog.category.fallback') : i18n.t('catalog.category.fallback');
  }

  function paymentLabel(id) {
    for (var i = 0; i < PAYMENTS.length; i++) {
      if (PAYMENTS[i].id === id) return PAYMENTS[i].label;
    }
    return i18n.t('catalog.payment.fallback');
  }

  /* The shops people buy things at, so a store's own return window or guarantee
     can be matched. What was typed is kept as typed; a store we know also gets
     its id. One id per chain across countries: each rule carries its region.
     regions: where the chain sells, for the suggestions only (matching does not care).
     exact: short or everyday names that only count when typed on their own. */
  var STORES = [
    { id: 'amazon', regions: ['US', 'CA', 'UK', 'MX'], name: 'Amazon', aliases: ['amazon.com', 'amazon.ca', 'amazon.co.uk', 'amazon uk', 'amazon canada', 'amazon.com.mx', 'amazon mexico', 'amazon méxico'] },
    { id: 'apple', regions: ['US', 'CA', 'UK'], name: 'Apple Store', aliases: ['apple', 'apple.com', 'the apple store'], exact: true },
    { id: 'bestbuy', regions: ['US', 'CA'], name: 'Best Buy', aliases: ['bestbuy', 'bestbuy.com', 'best buy canada'] },
    { id: 'costco', regions: ['US', 'CA', 'UK', 'MX'], name: 'Costco', aliases: ['costco wholesale', 'costco.com', 'costco.ca'] },
    { id: 'walmart', regions: ['US', 'CA', 'MX'], name: 'Walmart', aliases: ['wal-mart', 'walmart.com', 'walmart canada', 'walmart.ca'] },
    { id: 'target', regions: ['US'], name: 'Target', aliases: ['target.com'] },
    { id: 'staples', regions: ['US', 'CA'], name: 'Staples', aliases: ['staples.com', 'staples.ca', 'staples canada'] },
    { id: 'officedepot', regions: ['US', 'MX'], name: 'Office Depot', aliases: ['officemax', 'office max', 'office depot officemax'] },
    { id: 'homedepot', regions: ['US', 'CA', 'MX'], name: 'The Home Depot', aliases: ['home depot', 'homedepot', 'homedepot.com'] },
    { id: 'lowes', regions: ['US'], name: "Lowe's", aliases: ['lowes', 'lowes.com'] },
    { id: 'microcenter', regions: ['US'], name: 'Micro Center', aliases: ['microcenter'] },
    { id: 'gamestop', regions: ['US', 'CA'], name: 'GameStop', aliases: ['game stop'] },
    { id: 'dicks', regions: ['US'], name: "Dick's Sporting Goods", aliases: ["dick's", 'dicks'] },
    { id: 'rei', regions: ['US'], name: 'REI', aliases: ['rei co-op', 'rei.com'] },
    { id: 'nordstromrack', regions: ['US'], name: 'Nordstrom Rack', aliases: ['nordstromrack', 'nordstromrack.com'] },
    { id: 'nordstrom', regions: ['US'], name: 'Nordstrom', aliases: ['nordstrom.com'] },
    { id: 'zappos', regions: ['US'], name: 'Zappos', aliases: ['zappos.com'] },
    { id: 'ikea', regions: ['US', 'CA', 'UK'], name: 'IKEA', aliases: [] },
    { id: 'canadiantire', regions: ['CA'], name: 'Canadian Tire', aliases: [] },
    { id: 'mec', regions: ['CA'], name: 'MEC', aliases: ['mec.ca', 'mountain equipment company', 'mountain equipment co-op'] },
    { id: 'currys', regions: ['UK'], name: 'Currys', aliases: ['currys pc world', 'pc world'] },
    { id: 'argos', regions: ['UK'], name: 'Argos', aliases: [] },
    { id: 'ao', regions: ['UK'], name: 'AO.com', aliases: ['ao'], exact: true },
    { id: 'johnlewis', regions: ['UK'], name: 'John Lewis', aliases: ['john lewis & partners', 'john lewis and partners'] },
    { id: 'very', regions: ['UK'], name: 'Very', aliases: ['very.co.uk'], exact: true },
    { id: 'decathlon', regions: ['US', 'CA', 'UK'], name: 'Decathlon', aliases: [] },
    { id: 'liverpool', regions: ['MX'], name: 'Liverpool', aliases: ['liverpool.com.mx'] },
    { id: 'coppel', regions: ['MX'], name: 'Coppel', aliases: ['coppel.com'] },
    { id: 'elektra', regions: ['MX'], name: 'Elektra', aliases: ['elektra.mx', 'elektra.com.mx'] },
    { id: 'sanborns', regions: ['MX'], name: 'Sanborns', aliases: ['sanborns.com.mx'] },
    { id: 'palaciodehierro', regions: ['MX'], name: 'El Palacio de Hierro', aliases: ['palacio de hierro', 'elpalaciodehierro.com'] },
    { id: 'soriana', regions: ['MX'], name: 'Soriana', aliases: ['soriana.com'] },
    { id: 'llbean', regions: ['US', 'CA'], name: 'L.L.Bean', aliases: ['ll bean', 'llbean', 'l.l. bean', 'l l bean'] }
  ];

  function storeKey(t) { return String(t || '').toLowerCase().replace(/[\u2019']/g, "'").replace(/\s+/g, ' ').trim(); }

  /** "Staples", "the staples on king st", "bought it at Costco" -> 'staples', 'costco'; unknown -> '' */
  function storeId(text) {
    var t = storeKey(text);
    if (!t) return '';
    var i, s, names;
    for (i = 0; i < STORES.length; i++) {
      s = STORES[i];
      names = [storeKey(s.name)].concat(s.aliases.map(storeKey));
      if (s.id === t || names.indexOf(t) !== -1) return s.id;
    }
    for (i = 0; i < STORES.length; i++) {
      s = STORES[i];
      if (s.exact) continue;
      names = [storeKey(s.name)].concat(s.aliases.map(storeKey));
      for (var k = 0; k < names.length; k++) {
        var n = names[k].replace(/^the /, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp('(^|[^a-z0-9])' + n + '([^a-z0-9]|$)').test(t)) return s.id;
      }
    }
    return '';
  }

  /* The bank behind a credit card: card cover is the bank's to give, so a Chase rule
     does nothing for a Citi card. Amex and Discover issue their own cards. */
  var ISSUERS = [
    { id: 'chase', name: 'Chase', regions: ['US'] },
    { id: 'citi', name: 'Citi', regions: ['US'] },
    { id: 'capitalone', name: 'Capital One', regions: ['US', 'CA'] },
    { id: 'wellsfargo', name: 'Wells Fargo', regions: ['US'] },
    { id: 'usbank', name: 'U.S. Bank', regions: ['US'] },
    { id: 'bankofamerica', name: 'Bank of America', regions: ['US'] },
    { id: 'barclays', name: 'Barclays', regions: ['US', 'UK'] },
    { id: 'rbc', name: 'RBC', regions: ['CA'] },
    { id: 'td', name: 'TD', regions: ['US', 'CA'] },
    { id: 'scotiabank', name: 'Scotiabank', regions: ['CA', 'MX'] },
    { id: 'bmo', name: 'BMO', regions: ['CA'] },
    { id: 'cibc', name: 'CIBC', regions: ['CA'] },
    { id: 'nationalbank', name: 'National Bank', regions: ['CA'] },
    { id: 'desjardins', name: 'Desjardins', regions: ['CA'] },
    { id: 'bbva', name: 'BBVA', regions: ['MX'] },
    { id: 'banamex', name: 'Banamex', regions: ['MX'] },
    { id: 'santander', name: 'Santander', regions: ['MX', 'UK'] },
    { id: 'banorte', name: 'Banorte', regions: ['MX'] },
    { id: 'hsbc', name: 'HSBC', regions: ['MX', 'UK'] }
  ];
  function issuerName(id) {
    for (var i = 0; i < ISSUERS.length; i++) if (ISSUERS[i].id === id) return ISSUERS[i].name;
    return '';
  }

  function storeName(id) {
    for (var i = 0; i < STORES.length; i++) if (STORES[i].id === id) return STORES[i].name;
    return '';
  }

  global.OwedCatalog = {
    CATEGORIES: CATEGORIES,
    BRANDS: BRANDS,
    PAYMENTS: PAYMENTS,
    REGIONS: REGIONS,
    AGES: AGES,
    guessCategory: guessCategory,
    guessBrand: guessBrand,
    categoryLabel: categoryLabel,
    paymentLabel: paymentLabel,
    STORES: STORES,
    storeId: storeId,
    storeName: storeName,
    ISSUERS: ISSUERS,
    issuerName: issuerName
  };
})(window);
