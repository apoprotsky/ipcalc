if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0 //floor if number or convert non-number to 0;
        if ( this.length > targetLength )
            return String(this)
        padString = String(padString || ' ')
        targetLength = targetLength - this.length
        if ( targetLength > padString.length )
            padString += padString.repeat(targetLength / padString.length) //append to original to ensure we are longer than needed
        return padString.slice(0, targetLength) + String(this)
    }
}
String.prototype.inet_aton = function() {
    let buffer = new ArrayBuffer(4),
        dv     = new DataView(buffer),
        a      = this.split('.')
    for ( var i = 0; i < 4; i++ )
        dv.setUint8( i, a[i] )
    return dv.getUint32(0)
}
String.prototype.inet_wildcard = function() {
    return ( ~(this.inet_aton()) & 0xffffffff )
}

Number.prototype.inet_ntoa = function() {
    let buffer = new ArrayBuffer(4),
        dv     = new DataView(buffer),
        a      = new Array()
    dv.setUint32( 0, this )
    for ( var i = 0; i < 4; i++ )
        a[i] = dv.getUint8( i )
    return a.join('.')
}
Number.prototype.inet_bin = function() {
    let result = (this >>> 0).toString(2).padStart(32, '0').replace(/(.{8})/g, '$1 . ').slice(0, -3)
    return result
}
Number.prototype.bin = function(pad) {
    return (this >>> 0).toString(2)
}


/*global angular */
let app = angular.module('ipcalc', ['ngMaterial'])

app.config(function($mdThemingProvider, $mdIconProvider, $mdAriaProvider) {
    $mdThemingProvider
        .theme('default')
        .primaryPalette('blue', {
            'default': '700'
        })
    $mdIconProvider
        .defaultFontSet('FontAwesome')
        .fontSet('fa', 'FontAwesome')
   // Globally disables all ARIA warnings
   $mdAriaProvider.disableWarnings()
});

app.controller('controller', ['$scope', '$mdMedia', '$mdSidenav', function controller($scope, $mdMedia, $mdSidenav) {
    // Sidenav
    $scope.sidenav = true
    $scope.isLockedOpenSidenav = function() {
        return $scope.sidenav && $mdMedia('gt-md')
    }
    $scope.toggleSidenav = function() {
        if ( $mdMedia('gt-md') )
            $scope.sidenav = !$scope.sidenav
        else
            $mdSidenav('left').toggle()
    }
    // IP Calc
    $scope.input = { ip: '192.168.0.1', mask: '255.255.255.0', bits: 24 }
    $scope.dec = {}
    $scope.bin = {}
    $scope.onChangeMask = function() {
        let mask_ok = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test($scope.input.mask)
        if ( mask_ok ) {
            let wildcard = ~($scope.input.mask.inet_aton()) & 0xffffffff
            $scope.input.bits = wildcard.bin() !== '0' ? wildcard.bin().length : 0
        } else
            $scope.input.bits = ''
        $scope.update()
    }
    $scope.onChangeBits = function() {
        let mask_ok = /^[0-9]{1,2}$/.test($scope.input.bits) && $scope.input.bits >= 0 && $scope.input.bits <= 32
        if ( mask_ok )
            $scope.input.mask = (( 0xffffffff << ( 32 - parseInt($scope.input.bits) ) ) & 0xffffffff).inet_ntoa()
        else
            $scope.input.mask = ''
        $scope.update()
    }
    $scope.update = function() {
        // Checks
        let ip_ok = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test($scope.input.ip)
        let mask_ok = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test($scope.input.mask)
        if ( !ip_ok || !mask_ok ) {
            $scope.dec = {}
            $scope.bin = {}
            return
        }
        // Mask
        let mask = $scope.input.mask.inet_aton()
        $scope.dec.mask = mask.inet_ntoa()
        $scope.bin.mask = mask.inet_bin()
        // Wildcard
        let wildcard = ~mask & 0xffffffff
        $scope.dec.wildcard = wildcard.inet_ntoa()
        $scope.bin.wildcard = wildcard.inet_bin()
        // Network
        let net = $scope.input.ip.inet_aton() & mask
        $scope.dec.net = net.inet_ntoa() + ' / ' + (32 - (wildcard.bin() !== '0' ? wildcard.bin().length : 0))
        $scope.bin.net = net.inet_bin()
        // Addresses
        let addresses = wildcard + 1
        $scope.dec.addresses = addresses
        // Hosts
        let hosts = wildcard - 1
        if ( hosts < 0 )
            hosts = 0
        $scope.dec.hosts = hosts.toString()
            .split('').reverse().join('')
            .replace(/(.{3})/g, '$1 ').trim()
            .split('').reverse().join('')
        // Broadcast
        let broadcast = net + wildcard
        $scope.dec.broadcast = broadcast.inet_ntoa()
        $scope.bin.broadcast = broadcast.inet_bin()
        // Min host
        if ( hosts ) {
            let min = net + 1
            $scope.dec.min = min.inet_ntoa()
            $scope.bin.min = min.inet_bin()
        } else {
            $scope.dec.min = ''
            $scope.bin.min = ''
        }
        // Max host
        if ( hosts ) {
            let max = broadcast - 1
            $scope.dec.max = max.inet_ntoa()
            $scope.bin.max = max.inet_bin()
        } else {
            $scope.dec.max = ''
            $scope.bin.max = ''
        }
    }
    $scope.update()
}]);