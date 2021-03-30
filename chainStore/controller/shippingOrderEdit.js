app.factory('shippingEditService', function(baseHttp) {
    return {
    	queryChainShippingOrdersDetail: function(params, callback) {
            return baseHttp.service('api_backend/queryChainShippingOrdersDetail', params, callback);
        },
        saveOrders: function(params, callback) {
            return baseHttp.service('api_app/saveOrders', params, callback);
        },
        saveOrderDetail: function(params, callback) {
            return bSaseHttp.service('api_app/saveOrderDetail', params, callback);
        },
        queryVendor: function(params, callback) {
            return baseHttp.service('api_app/queryVendor', params, callback);
        },
        openInvoice: function(params, callback) {
            return baseHttp.service('api_app/openInvoice', params, callback);
        },
        getInvoicPDF: function(params, callback) {
            return baseHttp.service('api_app/getInvoicPDF', params, callback);
        },
        cancelInvoice: function(params, callback) {
            return baseHttp.service('api_app/cancelInvoice', params, callback);
        }
    }
});
app.controller('shippingEditController', function($rootScope, $scope, $window, $location, $http, $filter, $state, $stateParams, $modal, shippingEditService, util, storageUtil) {
	
    if ($stateParams.orderId == null) {
       console.log($stateParams);
    }

    let currentUser = storageUtil.getItem('currentUser');

    let param = { 'vendorId': currentUser.vendor.vendorId };
    shippingEditService.queryVendor(param, function(data, status, headers, config) {
        if (data.res) {
            $scope.seller = data.data;
        }
    })

    param = { "orderId": $stateParams.orderId }
    $scope.queryChainShippingOrdersDetail = function(param) {
    	console.log(param);
        shippingEditService.queryChainShippingOrdersDetail(param, function(data, status, headers, config) {
        	$scope.order = data.data.orderView;
        	console.log($scope.order);
        });
    }
    $scope.order;
    $scope.queryChainShippingOrdersDetail(param);



    $scope.save = function() {
        $scope.order.orders.expectDeliveryTime = $('#expectDeliveryTime').val();
        if ($scope.order.orders.orderStatus == 21 && $scope.order.orders.expectDeliveryTime == "") {
            util.alert('處理中狀態.... 預計出貨時間需必填');
        } else {
            util.confirm('訂單確定儲存?', function(r) {
                if (r) {
                    shippingEditService.saveOrders($scope.order, function(data, status, headers, config) {
                        if (data.res) {
                            util.alert('送出成功!');
                            $state.go("shippingMain");
                        } else {
                            util.alert(data.message);
                        }
                        $scope.loading = false;
                    })

                }
            })
        }

    }

    $scope.print = function(index) {
    	if(1 == index){
        	console.log($scope.order.orderDetailList);
          $state.go('orderReport', { "orders": $scope.order, "fn": "orderMain", "urlReport": "shippingMain" });
    	}else{
    		var detailList = [];
    		var orderDList = [];
        	console.log($scope.order.orderDetailList.length);
        	for(let i in $scope.order.orderDetailList){
        		$scope.order.orderDetailList[i].price= 0;
        		$scope.order.orderDetailList[i].priceProvider = 0;
               	detailList.push($scope.order.orderDetailList[i]);
        	}
        	console.log(detailList)
        	orderDList = $scope.order;
        	orderDList.orderDetailList = [];
        	for(let i in detailList){
        		orderDList.orderDetailList.push(detailList[i]);
        	}    	
        	console.log(orderDList);
        	$state.go('orderReport', { "orders": orderDList, "fn": "orderMain", "urlReport": "shippingMain" });
    	}
    }

    param = { "orderId": $stateParams.orderId };
    $scope.openInoice = function() {
        shippingEditService.openInvoice($scope.order, function(data, status, headers, config) {
            if (data.res) {
                $scope.queryChainShippingOrdersDetail(param);
                if (data.msg != null) {
                    util.alert(data.msg);
                }
            } else {
                util.alert(data.msg + "(" + data.resCode + ")");
            }
            $scope.loading = false;
        })
    }

    $scope.getInvoicPDF = function() {
        shippingEditService.getInvoicPDF($scope.order, function(data, status, headers, config) {
            if (data.res) {
                console.log(escape(data.data));
                var winparams = 'dependent=yes,locationbar=no,scrollbars=yes,menubar=yes,' +
                    'resizable,screenX=50,screenY=50,width=850,height=1050';
                var htmlPop = '<embed width=100% height=100%' +
                    ' type="application/pdf"' +
                    ' src="data:application/pdf;base64,' +
                    escape(data.data) +
                    '"></embed>';
                var printWindow = window.open("", "PDF", winparams);
                printWindow.document.write(htmlPop);
            } else {
                util.alert(data.msg + "(" + data.resCode + ")");
            }
            $scope.loading = false;
        })
    }

    $scope.cancelInvoice = function() {
        $scope.opv_cancelInvoice($scope.order);
    }

    $scope.opv_cancelInvoice = function(param) {

        var modalInstance = $modal.open({
            templateUrl: 'modules/vc/popover/view/cancelInvoice.html',
            backdrop: 'static',
            scope: $scope,
            controller: function($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, $modalInstance, util, storageUtil, shippingEditService) {
                $scope.order = param;

                $scope.cancel = function() {
                    $scope.inputDisabled = false;
                    $modalInstance.dismiss('cancel');
                }

                $scope.save = function(valid) {
                    if (valid) {
                        shippingEditService.cancelInvoice($scope.order, function(data, status, headers, config) {
                            if (data.res) {
                                $scope.queryChainShippingOrdersDetail({
                                    "orderId": $scope.order.orders.orderId
                                });
                                if (data.msg != null) {
                                    util.alert(data.msg);
                                }
                                $scope.inputDisabled = false;
                                $modalInstance.dismiss('cancel');
                            } else {
                                util.alert(data.msg + "(" + data.resCode + ")");
                            }
                            $scope.loading = false;
                        })
                    }
                }
            }
        })
    }

});