if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
        if ( this.length > targetLength )
            return String(this);
        padString = String(padString || ' ');
        targetLength = targetLength - this.length;
        if ( targetLength > padString.length )
            padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
        return padString.slice(0, targetLength) + String(this);
    };
}
String.prototype.inet_aton = function() {
    let buffer = new ArrayBuffer(4),
        dv     = new DataView(buffer),
        a      = this.split('.');
    for ( var i = 0; i < 4; i++ )
        dv.setUint8( i, a[i] );
    return dv.getUint32(0);
}
String.prototype.inet_wildcard = function() {
    return ( ~(this.inet_aton()) & 0xffffffff );
}

Number.prototype.inet_ntoa = function() {
    let buffer = new ArrayBuffer(4),
        dv     = new DataView(buffer),
        a      = new Array();
    dv.setUint32( 0, this );
    for ( var i = 0; i < 4; i++ )
        a[i] = dv.getUint8( i );
    return a.join('.');
}
Number.prototype.inet_bin = function() {
    let result = (this >>> 0).toString(2).padStart(32, '0').replace(/(.{8})/g, '$1 . ').slice(0, -3);
    return result;
}
Number.prototype.bin = function(pad) {
    return (this >>> 0).toString(2);
}


/*global angular */
let app = angular.module('ipcalc', ['ngMaterial']);

app.config(function($mdThemingProvider, $mdIconProvider, $mdAriaProvider) {
    $mdThemingProvider
        .theme('default')
        .primaryPalette('blue', {
            'default': '800',
            'hue-1': '100',
            'hue-2': '300',
            'hue-3': '500',
        })
        //.accentPalette('pink')
        //.warnPalette('red')
        //.backgroundPalette('blue')
        ;
    $mdIconProvider
        .defaultFontSet('FontAwesome')
        .fontSet('fa', 'FontAwesome');
   // Globally disables all ARIA warnings
   $mdAriaProvider.disableWarnings();
});

app.controller('controller', ['$scope', function controller($scope) {
    $scope.input = { ip: '192.168.0.1', mask: 24 };
    $scope.dec = {};
    $scope.bin = {};
    $scope.update = function() {
        // Проверка
        let ip_ok = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test($scope.input.ip);
        let mask_dot_ok = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test($scope.input.mask);
        let mask_number_ok = /^[0-9]{1,2}$/.test($scope.input.mask);
        if ( !ip_ok || !( mask_dot_ok || mask_number_ok ) ) {
            $scope.dec = {};
            $scope.bin = {};
            return;
        }
        // Прямая маска
        let mask;
        if ( mask_dot_ok )
            mask = $scope.input.mask.inet_aton();
        if ( mask_number_ok )
            mask = ( 0xffffffff << ( 32 - parseInt($scope.input.mask) ) ) & 0xffffffff;
        $scope.dec.mask = mask.inet_ntoa();
        $scope.bin.mask = mask.inet_bin();
        // Обратная маска
        let wildcard = ~mask & 0xffffffff;
        $scope.dec.wildcard = wildcard.inet_ntoa();
        $scope.bin.wildcard = wildcard.inet_bin();
        // Адрес сети
        let net = $scope.input.ip.inet_aton() & mask;
        $scope.dec.net = net.inet_ntoa() + ' / ' + (32 - (wildcard.bin() !== '0' ? wildcard.bin().length : 0));
        $scope.bin.net = net.inet_bin();
        // Количество хостов
        let hosts = wildcard - 1;
        if ( hosts < 0 )
            hosts = 0;
        $scope.dec.hosts = hosts.toString()
            .split('').reverse().join('')
            .replace(/(.{3})/g, '$1 ').trim()
            .split('').reverse().join('');
        // Широковещательный адрес
        let broadcast = net + wildcard;
        $scope.dec.broadcast = broadcast.inet_ntoa();
        $scope.bin.broadcast = broadcast.inet_bin();
        // Минимальный адрес хоста
        if ( hosts ) {
            let min = net + 1;
            $scope.dec.min = min.inet_ntoa();
            $scope.bin.min = min.inet_bin();
        } else {
            $scope.dec.min = '';
            $scope.bin.min = '';
        }
        // Максимальный адрес хоста
        if ( hosts ) {
            let max = broadcast - 1;
            $scope.dec.max = max.inet_ntoa();
            $scope.bin.max = max.inet_bin();
        } else {
            $scope.dec.max = '';
            $scope.bin.max = '';
        }
    }
    $scope.update();
}]);