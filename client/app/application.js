angular.module('forinlanguages', [
  'file-model',
  'LocalForageModule',
  'forinlanguages.services',
  'forinlanguages.peer'
])
.config(['$localForageProvider', function($localForageProvider){
  $localForageProvider.setNotify(true, true); // itemSet, itemRemove
}]);