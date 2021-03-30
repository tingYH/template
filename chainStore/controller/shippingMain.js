app.factory('shippingMainService', function (baseHttp) {
	return {
		cancelOutWarehouse: function (params, callback) {
            return baseHttp.service('api_app/cancelOutWarehouse', params, callback);
        },
		queryShippingOrderList: function (params, callback) {
			return baseHttp.service('api_app/queryShippingOrderList', params, callback);
		},
		queryVendorRelationList: function (params, callback) {
			return baseHttp.service('api_app/queryVendorRelationList ', params, callback);
		}
	}
});

app.controller('shippingMainController', function ($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, shippingMainService, formUtil, tableUtil, util, storageUtil, orderEditService) {

	$scope.currentVendorId = storageUtil.getItem('currentUser').vendor.vendorId;
	$scope.searchCondition = { "startDate": null, "endDate": null, 'vendorIdBuyer': $rootScope.chainOrderMainForVendorIdBuyer, 'orderStatus': $rootScope.chainOrderMainForOrderStatus };
	$scope.orderList = [];
	$scope.vendorList = [];

	let param = {
		"vendorRelationType": 2,
		"vendorIdProvider": $scope.currentVendorId
	}
	//  客戶列表
	shippingMainService.queryVendorRelationList(param, function (data, status, headers, config) {
		if (data.res) {
			$scope.vendorList = data.data;
		}
	})

	var columns_table = [
		{
			title: "單據日期", sWidth: "10%", data: null,
			render: function (data, type, full, meta) {
				var dataStr = $filter('date')(data.createDate, 'yyyy-MM-dd');
				return dataStr;
			}
		},  //oYYYYMMDDmmss
		{ title: "出貨單號", sWidth: "10%", data:"orderCode"},
		{ title: "原訂單號", sWidth: "10%", data: "orderCode" },
//		{
//			title: "物流單號", data: null,
//			render: function (data, type, full, meta) {
//				var dataStr = data.deliveryContent;
//				if (data.deliveryContent == null) {
//					dataStr = '尚未完成物流設定';
//				}
//				return dataStr;
//			}
//		},
		{ title: "訂貨客戶(分店)", sWidth: "15%", data: "vendorBuyerName" },
		{
			title: "金額", sWidth: "8%", data: null,
			render: function (data, type, full, meta) {
				var dataStr = $filter('number')(data.total, 0);
				return dataStr;
			}
		},
		{
			title: "物流單號", data: null,
			render: function (data, type, full, meta) {
				var dataStr = $filter('number')(data.total, 0);
				return dataStr;
			}
		},
		{
			title: "出貨單狀態", data: null, render: function (data, type, full, meta) {
//				var dataStr = $filter('orderStatus')(data.orders.orderStatus);
				return '已備貨';
			}
		},
		{
			title: "操作", data: null, sWidth: "25%", "bSortable": false, render: function (data, type, full, meta) {
				var btnStr = '';
				if (data.comfirmOutWarehouse==1) {
					btnStr += '<button name="chain_cart" class="btn btn-sm btn-dele margin" value="' + meta.row + '"><i class="ace-icon fa fa-pencil-square-o"></i>取消出庫</button>'
				}
				if (data.comfirmOutWarehouse !=1) {
					btnStr += '<button name="checkout" class="btn btn-sm btn-search margin_left"   value="' + meta.row + '">確認出庫</button>';
				}
				btnStr += '<button name="order_detail" class="btn btn-sm btn-edit margin_left" value="' + meta.row + '">出貨單明細</button>';

				return btnStr;
			}
		}
	];


	var opt_table = {
		"oLanguage": { "sUrl": "dataTables.zh-tw.txt" },
		"bJQueryUI": true,
		select: false,
		"sPaginationType": 'full_numbers',
		data: $scope.orderList,
		"scrollX": "100%",
		columns: columns_table,
		"order": [[1, 'desc']],
		columnDefs: [
			{ className: 'text-right', targets: [4] },
		]
	};

	var dataTable = $('#data_table').DataTable(opt_table);

	$scope.queryShippingOrderList = function (param) {
		shippingMainService.queryShippingOrderList(param, function (data, status, headers, config) {
			if (data.res) {
				$scope.orderList = data.data;
				util.refreshDataTable(dataTable, $scope.orderList);
			}
		})
	};


	
	$scope.queryOrders = function () {
		$scope.searchCondition.orderType = 2;
		$scope.searchCondition.vendorIdSeller = $scope.currentVendorId;
		$scope.searchCondition.startDate = $('#startDate').val();
		$scope.searchCondition.endDate = $('#endDate').val();
		$rootScope.chainOrderMainForStartDate = $('#startDate').val();
		$rootScope.chainOrderMainForEndDate = $('#endDate').val();
		$rootScope.chainOrderMainForVendorIdBuyer = $scope.searchCondition.vendorIdBuyer;
		$rootScope.chainOrderMainForOrderStatus = $scope.searchCondition.orderStatus;
		$scope.queryShippingOrderList($scope.searchCondition);
	}

	$('#startDate').val($rootScope.chainOrderMainForStartDate);
	$('#endDate').val($rootScope.chainOrderMainForEndDate);
	$scope.queryOrders();

	$('#data_table tbody').on('click', 'button[name="chain_cart"]', function () {
		var index = $(this).val();
		var orders = $scope.orderList[index];
		shippingMainService.cancelOutWarehouse($scope.orderList[index]
		, function (data, status, headers, config) {
				if (data.res) {
					util.alert('取消出庫成功');
				}
				location.reload()
			}
		)
//		$state.go('chainCart', { "orderId": orders.orderId, "vendorBuyerName": vendorBuyerName, "fn": 1 });
	});


//  $scope.chainCart = function() {
//  $state.go('chainCart', { "orderId": $stateParams.orderId, "fn": 1 });
//}
	
	$('#data_table tbody').on('click', 'button[name="order_detail"]', function () {
		var index = $(this).val();

		var orders = $scope.orderList[index];
		console.log($scope.orderList[index].id)
		$state.go('shippingOrderEdit', { "orderId":orders, "fn": 1 });
	});

	$('#data_table tbody').on('click', 'button[name="checkout"]', function () {
		var index = $(this).val();
		var orders = $scope.orderList[index];
		shippingMainService.cancelOutWarehouse($scope.orderList[index]
		, function (data, status, headers, config) {
				if (data.res) {
					util.alert('確認出庫成功');
				}
				location.reload()
			}
		)
	});

//	$scope.setOrderComplete = function (index) {
//		util.confirm('訂單[ ' + $scope.orderList[index].orders.orderCode + ']確定要結帳?', function (r) {
//			if (r) {
//				let param = {
//					"orderId": $scope.orderList[index].orders.orderId
//				}
//				orderEditService.queryPurchaseDetail(param, function (data, status, headers, config) {
//					if (data.res) {
//						let order = data.data;
//						order.orders.orderStatus = 61;
//						orderEditService.saveOrders(order, function (data, status, headers, config) {
//							if (data.res) {
//								$scope.queryOrders();
//							}
//						})
//					}
//				});
//			}
//		})
//	}
});


