/* ============================================================
   Owed — catalog of categories, brands, payment methods, regions
   Shared by the landing page teaser and the app.
   ============================================================ */
(function (global) {
  'use strict';

  var CATEGORIES = [
    { id: 'phone',           label: 'Phone',                 keywords: ['phone', 'iphone', 'pixel', 'galaxy', 'smartphone', 'mobile'] },
    { id: 'laptop',          label: 'Laptop or computer',    keywords: ['laptop', 'macbook', 'notebook', 'computer', 'pc', 'desktop', 'chromebook'] },
    { id: 'tablet',          label: 'Tablet or e-reader',    keywords: ['tablet', 'ipad', 'kindle', 'e-reader', 'surface'] },
    { id: 'headphones',      label: 'Headphones or earbuds', keywords: ['headphone', 'headphones', 'earbud', 'earbuds', 'airpod', 'airpods', 'earphone', 'buds', 'headset'] },
    { id: 'tv',              label: 'TV or monitor',         keywords: ['tv', 'television', 'monitor', 'display', 'screen'] },
    { id: 'console',         label: 'Games console',         keywords: ['console', 'playstation', 'ps5', 'xbox', 'switch', 'controller'] },
    { id: 'camera',          label: 'Camera',                keywords: ['camera', 'lens', 'dslr', 'mirrorless', 'gopro'] },
    { id: 'watch',           label: 'Watch or tracker',      keywords: ['watch', 'smartwatch', 'fitbit', 'tracker', 'garmin'] },
    { id: 'appliance-large', label: 'Big appliance',         keywords: ['fridge', 'refrigerator', 'freezer', 'washer', 'washing machine', 'dryer', 'dishwasher', 'oven', 'stove', 'range', 'furnace', 'water heater'] },
    { id: 'appliance-small', label: 'Small appliance',       keywords: ['kettle', 'toaster', 'microwave', 'blender', 'coffee', 'espresso', 'mixer', 'air fryer', 'fryer', 'iron', 'humidifier', 'fan', 'heater'] },
    { id: 'vacuum',          label: 'Vacuum',                keywords: ['vacuum', 'hoover', 'roomba', 'dyson'] },
    { id: 'kitchen',         label: 'Cookware or kitchen',   keywords: ['pan', 'pot', 'cookware', 'skillet', 'cast iron', 'knife', 'knives', 'cutlery', 'bakeware'] },
    { id: 'power-tool',      label: 'Power tool',            keywords: ['drill', 'saw', 'tool', 'sander', 'grinder', 'mower', 'trimmer', 'wrench', 'screwdriver'] },
    { id: 'furniture',       label: 'Furniture',             keywords: ['chair', 'desk', 'sofa', 'couch', 'table', 'shelf', 'bookcase', 'furniture'] },
    { id: 'mattress',        label: 'Mattress or bedding',   keywords: ['mattress', 'bed', 'pillow', 'duvet'] },
    { id: 'footwear',        label: 'Shoes or boots',        keywords: ['shoe', 'shoes', 'boot', 'boots', 'sneaker', 'sneakers', 'trainers', 'sandal'] },
    { id: 'apparel',         label: 'Clothing',              keywords: ['jacket', 'coat', 'shirt', 'trousers', 'pants', 'clothing', 'sock', 'socks', 'fleece', 'hoodie'] },
    { id: 'bag',             label: 'Bag or luggage',        keywords: ['bag', 'backpack', 'rucksack', 'luggage', 'suitcase', 'duffel', 'purse', 'wallet'] },
    { id: 'bike',            label: 'Bike or scooter',       keywords: ['bike', 'bicycle', 'scooter', 'ebike', 'e-bike'] },
    { id: 'outdoor',         label: 'Outdoor gear',          keywords: ['tent', 'sleeping bag', 'stove', 'backpacking', 'camping', 'kayak', 'ski', 'snowboard'] },
    { id: 'printer',         label: 'Printer',               keywords: ['printer', 'scanner', 'ink'] },
    { id: 'toy',             label: 'Toy or baby gear',      keywords: ['toy', 'stroller', 'pushchair', 'car seat', 'crib', 'lego'] },
    { id: 'other',           label: 'Something else',        keywords: [] }
  ];

  var BRANDS = [
    'Apple', 'Samsung', 'Google', 'Sony', 'Bose', 'Sennheiser', 'JBL', 'Anker', 'Beats',
    'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft', 'Razer', 'LG', 'TCL', 'Hisense',
    'Nintendo', 'Canon', 'Nikon', 'Fujifilm', 'GoPro', 'Garmin', 'Fitbit',
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
    { id: 'visa',       label: 'Visa credit card' },
    { id: 'mastercard', label: 'Mastercard credit' },
    { id: 'amex',       label: 'American Express' },
    { id: 'discover',   label: 'Discover' },
    { id: 'debit',      label: 'Debit card' },
    { id: 'cash',       label: 'Cash' },
    { id: 'unknown',    label: "Can't remember" }
  ];

  var REGIONS = [
    { id: 'US', label: 'United States' },
    { id: 'CA', label: 'Canada' },
    { id: 'UK', label: 'United Kingdom' },
    { id: 'EU', label: 'European Union' }
  ];

  var AGES = [
    { id: 3,   label: 'Within the last 3 months' },
    { id: 9,   label: 'About 6 months to a year' },
    { id: 14,  label: 'A year or so ago' },
    { id: 22,  label: 'About two years ago' },
    { id: 34,  label: 'About three years ago' },
    { id: 60,  label: 'Four to six years ago' },
    { id: 96,  label: 'Longer than that' }
  ];

  /**
   * Guess a category from free text. Returns a category id or null.
   * Longest keyword wins so "cast iron" beats "iron".
   */
  function guessCategory(text) {
    if (!text) return null;
    var t = String(text).toLowerCase();
    var best = null;
    var bestLen = 0;
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

  /** Guess a brand from free text. Returns the brand name or null. */
  function guessBrand(text) {
    if (!text) return null;
    var t = String(text).toLowerCase();
    var best = null;
    var bestLen = 0;
    BRANDS.forEach(function (b) {
      var lb = b.toLowerCase();
      if (lb === 'other') return;
      if (t.indexOf(lb) !== -1 && lb.length > bestLen) {
        best = b;
        bestLen = lb.length;
      }
    });
    return best;
  }

  function categoryLabel(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i].label;
    }
    return 'Item';
  }

  function paymentLabel(id) {
    for (var i = 0; i < PAYMENTS.length; i++) {
      if (PAYMENTS[i].id === id) return PAYMENTS[i].label;
    }
    return 'Unknown';
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
    paymentLabel: paymentLabel
  };
})(window);
