app.factory('chainPurchaseMainService', function (baseHttp) {
	return {
		queryOrdersList: function (params, callback) {
			return baseHttp.service('api_app/queryOrdersList', params, callback);
		}
	}
});
app.controller('chainPurchaseMainController', function ($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, chainPurchaseMainService, storageUtil, tableUtil, util) {

	var currentUser = storageUtil.getItem('currentUser');
	$scope.search = {
		"orderStatus": null,
		"orderType": 3,
		"vendorIdBuyer": currentUser.vendor.vendorId,
	}

	$scope.orderList = [];

	$scope.queryOrder = function () {
		$scope.queryOrderList($scope.search);
	}

	$scope.queryOrderList = function (param) {
		chainPurchaseMainService.queryOrdersList(param, function (data, status, headers, config) {
			if (data.res) {
				$scope.orderList = data.data;
				util.refreshDataTable(dataTable, $scope.orderList);
			}
		})
	};

	$scope.queryOrder();

	var dataTable = $('#optTable').DataTable(tableUtil.getPurchaseTable($scope.orderList, $scope));

	$scope.purchaseDetail = function (index) {
		let order = $scope.orderList[index].orders;
		$state.go('purchaseEdit', { "orderId": order.orderId });
	};
	$scope.purchaseRate = function () {

		var modalInstance = $modal.open({
			templateUrl: 'modules/vc/popover/view/purchaseRate.html',
			backdrop: 'static',
			scope: $scope,
			controller: function ($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, $modalInstance, util) {
				$scope.cancel = function () {
					$scope.inputDisabled = false;
					$modalInstance.dismiss('cancel');

				}
				$scope.save = function (valid) {
					util.confirm('確定要新增 <font color="red">' + $scope.userInfo.userCode + '</font>', function (r) {
						if (r) {
							if (valid) {
								$scope.cancel();
								//util.alert('儲存成功');
								$scope.queryOrder();
							} else {
								util.alert('必填欄位未輸入');
							}
						}
					});
				}
			}
		});
	};


	$scope.addPurchase = function () {
		$state.go('purchaseChain');
	}
});