app.factory('branchOrderService', function (baseHttp) {
	return {
		queryVendorRelationList: function (params, callback) {
			return baseHttp.service('api_app/queryVendorRelationList', params, callback);
		},
		queryBranchOrderList: function (params, callback) {
			return baseHttp.service('api_app/queryBranchOrderList', params, callback);
		}
	}
});

/**
 * 訂單查詢
 * 
 */

app.controller('branchOrderController', function ($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, branchOrderService, storageUtil, tableUtil, util) {

	$scope.vendorList = [];
	$scope.orderList = [];
	var currentUser = storageUtil.getItem('currentUser');

	$scope.search = {
		// "orderType": 1,
		"vendorIdHead": currentUser.vendor.vendorId,
		"vendorIdSeller": null,
		"vendorIdBuyer": null,
		"orderStatus": null,
		"startDate": null,
		"endDate": null
	}

	let param = {
		"vendorRelationType": 2,
		"vendorIdProvider": currentUser.vendor.vendorId
	}

	var columns = [
		{ title: "店家名稱", data: "orders.vendorNameBuyer" },
		{
			title: "訂單日期", data: null,
			render: function (data, type, full, meta) {
				var dataStr = $filter('date')(data.orders.creationDate, 'yyyy-MM-dd');
				return dataStr;
			}
		},
		{ title: "訂單編號", data: "orders.orderCode" },
		{ title: "物流單號", data: "orders.deliveryContent" },
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
		{ title: "發票號碼", data: "orders.taxId" },
		{
			title: "操作",
			data: null,
			"bSortable": false,
			"bSearchable": false,
			render: function (data, type, row, meta) {
				return '<button type="button" name="orders_eidt" class="btn btn-sm btn-edit pull-right margin_left" value="' + meta.row + '">訂單明細</button>';
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
		columns: columns,
		"order": [[2, 'desc']],
		columnDefs: [
			{ className: 'text-right', targets: [4] },
		]
	};

	var dataTable = $('#optTable').DataTable(opt_table);

	//  客戶列表
	branchOrderService.queryVendorRelationList(param, function (data, status, headers, config) {
		if (data.res) {
			$scope.vendorList = data.data;
		}
	})

	$scope.queryOrder = function () {
		$scope.search.startDate = $('#startDate').val();
		$scope.search.endDate = $('#endDate').val();
		$scope.queryOrdersList($scope.search);
	}

	$scope.queryOrdersList = function (param) {
		branchOrderService.queryBranchOrderList(param, function (data, status, headers, config) {
			if (data.res) {
				$scope.orderList = data.data;
				util.refreshDataTable(dataTable, $scope.orderList);
			}
		})
	};

	$scope.queryOrder();


	$('#optTable tbody').on('click', 'button[name="orders_eidt"]', function () {
		var index = $(this).val();
		let order = $scope.orderList[index].orders;
		$state.go('purchaseEdit', { "orderId": order.orderId });
	});

});
