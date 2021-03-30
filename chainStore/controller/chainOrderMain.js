app.factory('chainOrderMainService', function (baseHttp) {
	return {
		queryOrdersList: function (params, callback) {
			return baseHttp.service('api_app/queryOrdersList', params, callback);
		},
		queryVendorRelationList: function (params, callback) {
			return baseHttp.service('api_app/queryVendorRelationList ', params, callback);
		}
	}
});

app.controller('chainOrderMainController', function ($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, chainOrderMainService, formUtil, tableUtil, util, storageUtil, orderEditService) {

	$scope.currentVendorId = storageUtil.getItem('currentUser').vendor.vendorId;
	$scope.searchCondition = { "startDate": null, "endDate": null, 'vendorIdBuyer': $rootScope.chainOrderMainForVendorIdBuyer, 'orderStatus': $rootScope.chainOrderMainForOrderStatus };
	$scope.orderList = [];
	$scope.vendorList = [];

	let param = {
		"vendorRelationType": 2,
		"vendorIdProvider": $scope.currentVendorId
	}
	//  客戶列表
	chainOrderMainService.queryVendorRelationList(param, function (data, status, headers, config) {
		if (data.res) {
			$scope.vendorList = data.data;
		}
	})

	var columns_table = [
//		{
//			title: "訂單日期", sWidth: "10%", data: null,
//			render: function (data, type, full, meta) {
//				var dataStr = $filter('date')(data.orders.creationDate, 'yyyy-MM-dd');
//				return dataStr;
//			}
//		},
		{
			title: "訂單日期", sWidth: "10%", data: null,
			render: function (data, type, full, meta) {
				var dataStr = $filter('date')(data.orders.creationDate, 'yyyy-MM-dd');
				return dataStr;
			}
		},
		{ title: "訂單編號", sWidth: "10%", data: "orders.orderCode" },
		{
			title: "物流單號", data: null,
			render: function (data, type, full, meta) {
				var dataStr = data.deliveryContent;
				if (data.deliveryContent == null) {
					dataStr = '尚未完成物流設定';
				}
				return dataStr;
			}
		},
		{ title: "分店名稱", sWidth: "20%", data: "orders.vendorNameBuyer" },
		{
			title: "金額", sWidth: "8%", data: null,
			render: function (data, type, full, meta) {
				var dataStr = $filter('number')(data.orders.total, 0);
				return dataStr;
			}
		},
		{
			title: "狀態", data: null, render: function (data, type, full, meta) {
				var dataStr = $filter('orderStatus')(data.orders.orderStatus);
				return dataStr;
			}
		},
		{
			title: "操作", data: null, sWidth: "30%", "bSortable": false, render: function (data, type, full, meta) {
				var btnStr = '';
				console.log(data);
				if (data.separateOrders) {
					btnStr += '<button name="chain_cart" class="btn btn-sm btn-dele margin" value="' + meta.row + '"><i class="ace-icon fa fa-pencil-square-o"></i>轉採購單</button>'
				}
				if (data.orders.orderStatus < 61) {
					btnStr += '<button name="checkout" class="btn btn-sm btn-search margin_left"   value="' + meta.row + '">結帳作業</button>';
				}
				btnStr += '<button name="order_detail" class="btn btn-sm btn-edit margin_left" value="' + meta.row + '">訂單明細</button>';

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

	$scope.queryOrdersList = function (param) {
		chainOrderMainService.queryOrdersList(param, function (data, status, headers, config) {
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
		$scope.queryOrdersList($scope.searchCondition);
	}

	$('#startDate').val($rootScope.chainOrderMainForStartDate);
	$('#endDate').val($rootScope.chainOrderMainForEndDate);
	$scope.queryOrders();

	$('#data_table tbody').on('click', 'button[name="chain_cart"]', function () {
		var index = $(this).val();
		var orders = $scope.orderList[index].orders;
		$state.go('chainCart', { "orderId": orders.orderId, "vendorNameBuyer": orders.vendorNameBuyer, "fn": 1 });
	});


	$('#data_table tbody').on('click', 'button[name="order_detail"]', function () {
		var index = $(this).val();
		var orders = $scope.orderList[index].orders;
		$state.go('chainOrderEdit', { "orderId": orders.orderId, "fn": 1 });
	});

	$('#data_table tbody').on('click', 'button[name="checkout"]', function () {
		var index = $(this).val();
		$scope.setOrderComplete(index);
	});

	$scope.setOrderComplete = function (index) {
		util.confirm('訂單[ ' + $scope.orderList[index].orders.orderCode + ']確定要結帳?', function (r) {
			if (r) {
				let param = {
					"orderId": $scope.orderList[index].orders.orderId
				}
				orderEditService.queryPurchaseDetail(param, function (data, status, headers, config) {
					if (data.res) {
						let order = data.data;
						order.orders.orderStatus = 61;
						orderEditService.saveOrders(order, function (data, status, headers, config) {
							if (data.res) {
								$scope.queryOrders();
							}
						})
					}
				});
			}
		})
	}
});


