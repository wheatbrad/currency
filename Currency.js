function Currency() {}
var currencyUtilities = {
    convertStringToNumber: function (value) {
        return +value.replace(/[$,%]/g, '');
    },
    normalizeValue: function (value) {
        if (!value) return 0;
    
        var val = typeof value === 'string' ? this.convertStringToNumber(value) : value;
    
        return val * 100 || 0;
    },
    normalizeOperand: function (value) {
        var val = typeof value === 'string' ? this.convertStringToNumber(value) : value;
    
        return val >= 0 ? val : 1;
    },
    normalizePercent: function (value) {
        var pct = typeof value === 'string' ? this.convertStringToNumber(value) : value;
    
        return pct / 100;
    },
    formatMajorUnitString: function (value) {
        // return value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,')
        var result = value;

        if (value > 999) {
            var val = value.toString();
            var i = val.length - 1
            var j = i - 2;
            var result = '';
    
            do {
                result = ((i - j) % 3 === 0 && i !== 0)
                    ? ',' + val.charAt(i) + result
                    : val.charAt(i) + result;
            } while (i--);
        }

        return result;
    }
};

var currencyFactory = (function (utilities) {
    /**
     * 
     * @param {string|number} value Optional initial value.
     * @param {object} config Optional configuration object. Contains two properties, displayMinorUnits which can hold the values "alway", "never", "nonzero" and rounding which can hold the values "nearest", "down", "up".
     * @returns Instance of Currency
     */
    return function (value, config) {
        if (
            typeof config === 'undefined' ||
            Object.prototype.toString.call(config) !== '[object Object]'
        ) {
            config = {
                displayMinorUnits: 'always', // should have 3 values always | never | nonzero 
                rounding: 'nearest' // 3 values nearest | down | up
            };
        }

        var roundingConfig = {
            'nearest': Math.round,
            'down': Math.floor,
            'up': Math.ceil
            // TODO: banker's rule - more elaborate model for rounding
        };
        var roundingFunc = roundingConfig[config.rounding] || roundingConfig['nearest'];
        
        var currency = new Currency();
        var _currentValue = 0;

        currency.add = function (value) {
            _currentValue += value instanceof Currency ? value.raw() : utilities.normalizeValue(value);

            return this;
        };
        currency.subtract = function (value) {
            _currentValue -= value instanceof Currency ? value.raw() : utilities.normalizeValue(value);

            return this;
        };
        currency.multiply = function (value) {
            _currentValue *= value instanceof Currency ? value.raw() : utilities.normalizeOperand(value);

            return this;
        };
        currency.divide = function (value) {
            _currentValue /= value instanceof Currency ? value.raw() : utilities.normalizeOperand(value);

            return this;
        };
        currency.percentage = function (value) {
            _currentValue *= value instanceof Currency ? value.raw() : utilities.normalizePercent(value);

            return this;
        };
        currency.raw = function() {
            return _currentValue;
        };
        currency.print = function () {
            var value = roundingFunc(_currentValue);
            var sign = '';
            
            if (value < 0) {
                sign = '-';
                value = Math.abs(value);
            }
            
            var minorUnit = value % 100;
            var majorUnit = utilities.formatMajorUnitString((value - minorUnit) / 100);
            switch (config.displayMinorUnits) {
                
                case 'never':
                    minorUnit = '';
                    break;
                    
                case 'nonzero':
                    minorUnit = minorUnit === 0 ? '' : minorUnit < 10 ? '.0' + minorUnit : '.' + minorUnit;
                    break;
                        
                default:
                    // 'always' is default configuration
                    minorUnit = minorUnit < 10 ? '.0' + minorUnit : '.' + minorUnit;
            }

            return sign + '$' + majorUnit + minorUnit;
        };
        currency.destroy = function () {
            value          = null;
            config         = null;
            roundingConfig = null;
            roundingFunc   = null;
            _currentValue  = null;
            delete this.add;
            delete this.subtract;
            delete this.multiply;
            delete this.divide;
            delete this.percentage;
            delete this.raw;
            delete this.print;
            delete this.destroy;
            delete this.toString;
            delete this.valueOf;
        };
        currency.toString = function () {
            return this.print();
        };
        currency.valueOf = function () {
            return this.print();
        };
    
        return currency.add(value);
    }
})(currencyUtilities);