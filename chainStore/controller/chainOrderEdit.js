app.factory('chainOrderEditService', function(baseHttp) {
    return {
        queryChainOrdersDetail: function(params, callback) {
            return baseHttp.service('api_backend/queryChainOrdersDetail', params, callback);
        },
        saveOrders: function(params, callback) {
            return baseHttp.service('api_app/saveOrders', params, callback);
        },
        saveOrderDetail: function(params, callback) {
            return baseHttp.service('api_app/saveOrderDetail', params, callback);
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
        },
        saveOrders: function (params, callback) {
            return baseHttp.service('api_app/saveOrders', params, callback);
        },
        separateOrders: function (params, callback) {
            return baseHttp.service('api_backend/separateOrders', params, callback);
        },
    }
});
app.controller('chainOrderEditController', function($rootScope, $scope, $window, $location, $http, $filter, $state, $stateParams, $modal, chainOrderEditService, util, storageUtil) {
	$stateParams.orderId;
	$scope.vendorList = [];
	$scope.vendorIsSelf = [];
    if ($stateParams.orderId == null) {
        $window.history.back();
    }

    let currentUser = storageUtil.getItem('currentUser');

    let param = { 'vendorId': currentUser.vendor.vendorId };
    chainOrderEditService.queryVendor(param, function(data, status, headers, config) {
        if (data.res) {
            $scope.seller = data.data;
            console.log(data.data);
        }
    })

    param = { "orderId": $stateParams.orderId }
    $scope.queryChainOrdersDetail = function(param) {
        chainOrderEditService.queryChainOrdersDetail(param, function(data, status, headers, config) {
            if (data.res) {
                $scope.order = data.data;

                for(var i = 0; i < data.data.orderDetailList.length; i++){
                	if(data.data.orderDetailList[i].vendorName != $scope.seller.vendorName){
                		$scope.vendorIsSelf.push(false);
                	}else{
                		$scope.vendorIsSelf.push(true);
                	}
//                	if(data.data.orderDetailList[i].vendorIdCooperation !=null ){
//                		 $scope.vendorList.push({id : data.data.orderDetailList[i].vendorIdCooperation, name : data.data.orderDetailList[i].vendorIdCooperation});
//                	}
                }
                console.log($scope.vendorIsSelf);
                console.log(data.data);
                $('#expectDeliveryTime').val($filter('date')($scope.order.orders.expectDeliveryTime, 'yyyy-MM-dd'));
            }
        });
    }
    $scope.order;
    $scope.queryChainOrdersDetail(param);
    $scope.ordersViewList = [];
    
    $scope.chainCart = function() {
    	param = { "orderId": $stateParams.orderId, "updatedBy": currentUser.userId };
    	chainOrderEditService.separateOrders(param, function (data, status, headers, config) {
            if (data.res) {
            	console.log("_"+data.data);
                if (data.data.length == 0 || data.data == null) {
                    util.alert('訂單都傳給其他供應商囉!');
                    $state.go('chainOrderMain');
                }
                for(var i = 0; i < data.data.length; i++){ 
                	if(data.data[i].orders != null){
                		 $scope.ordersViewList.push(data.data[i]);
                	}
                }
            }
        });
    }

    $scope.addProduct = function() {
        $scope.openPopoverView($scope.order);
    }
    
    $scope.save = function() {
        $scope.order.orders.expectDeliveryTime = $('#expectDeliveryTime').val();
        if ($scope.order.orders.orderStatus == 21 && $scope.order.orders.expectDeliveryTime == "") {
            util.alert('處理中狀態.... 預計出貨時間需必填');
        } else {
            util.confirm('訂單確定儲存?', function(r) {
                if (r) {
                    chainOrderEditService.saveOrders($scope.order, function(data, status, headers, config) {
                        if (data.res) {
                            util.alert('送出成功!');
                            $state.go("chainOrderMain");
                        } else {
                            util.alert(data.message);
                        }
                        $scope.loading = false;
                    })

                }
            })
        }
    }


    $scope.print = function() {
        // window.print();
        $state.go('orderReport', { "orders": $scope.order, "fn": "orderMain", "urlReport": "chainOrderEdit" });
    }

    $scope.openPopoverView = function(orderPeram) {

        $scope.disabled = true;
        var modalInstance = $modal.open({
            templateUrl: 'modules/vc/popover/view/addOrderProduct.html',
            backdrop: 'static',
            scope: $scope,
            controller: function($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, $modalInstance, util, storageUtil, purchaseChainService, orderEditService) {

                $scope.orderPeram = orderPeram;
                $scope.supplierList = [];
                $scope.cartList = [];
                $scope.productQuoteList = [];

                var currentUser = storageUtil.getItem('currentUser');
                let param = { 'vendorId': currentUser.vendor.vendorId, 'vendorIdBuyer': $scope.orderPeram.orders.vendorIdBuyer }
                //搜尋採購廠商及商品類別
                purchaseChainService.queryChainProductList(param, function(data, status, headers, config) {
                    if (data.res) {
                        $scope.supplierList = data.data;
                    }
                })

                //所有供應商商品報價
                purchaseChainService.queryChainProductQuoteList(param, function(data, status, headers, config) {
                    if (data.res) {
                        $scope.cartList = data.data;
                    }
                });

                $scope.search = {
                    vendorIdBuyer: $scope.order.vendorIdBuyer,
                    supplier: $scope.supplierList[0],
                    dictionaries: null,
                    keyword: ""
                }

                $scope.queryCommodity = function() {
                    let param = {
                        'vendorIdBuyer': currentUser.vendor.vendorId,
                        'vendorId': null,
                        'productType': null,
                        'productName': $scope.search.keyword
                    };
                    if ($scope.search.supplier != null) {
                        param.vendorId = $scope.search.supplier.vendor.vendorId;
                    }
                    if ($scope.search.dictionaries != null) {
                        param.productType = $scope.search.dictionaries.dictionaryId;
                    }
                }
                $scope.cancel = function() {
                    $scope.inputDisabled = false;
                    $modalInstance.dismiss('cancel');
                    // $state.go('orderEdit', { "orderId": $scope.order.orderId });
                    $state.reload({ "orderId": $scope.orderPeram.orderId });
                }

                $scope.save = function() {
                    util.confirm('是否確定新增產品?', function(r) {
                        if (r) {

                            let cartList = [];

                            for (let i in $scope.supplierList) {

                                for (let c in $scope.cartList) {
                                    if ($scope.cartList[c].vendorId == $scope.supplierList[i].vendor.vendorId && ($scope.cartList[c].quantity > 0 || $scope.cartList[c].quantityPayment > 0)) {
                                        if ($scope.cartList[c].isPaymentUnit == 0) {
                                            $scope.cartList[c].quantity = $scope.cartList[c].quantityPayment;
                                        }
                                        cartList.push($scope.cartList[c]);
                                    }
                                }

                            }

                            if (cartList.length > 0) {
                                let param = {
                                    "orders": {
                                        "orderId": $scope.orderPeram.orders.orderId
                                    },
                                    "productQuoteView": cartList
                                }
                                chainOrderEditService.saveOrderDetail(param, function(data, status, headers, config) {
                                    if (data.res) {
                                        util.alert('送出成功!');
                                        $state.reload('chainOrderEdit', { "orderId": $stateParams.orderId });
                                        $scope.cancel();
                                    } else {
                                        util.alert(data.message);
                                    }
                                    $scope.loading = false;
                                })

                            }
                        }
                    })
                }
            }
        })
    }
    param = { "orderId": $stateParams.orderId };
    $scope.openInoice = function() {
        chainOrderEditService.openInvoice($scope.order, function(data, status, headers, config) {
            if (data.res) {
                $scope.queryChainOrdersDetail(param);
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
        chainOrderEditService.getInvoicPDF($scope.order, function(data, status, headers, config) {
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
            controller: function($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, $modalInstance, util, storageUtil, chainOrderEditService) {
                $scope.order = param;

                $scope.cancel = function() {
                    $scope.inputDisabled = false;
                    $modalInstance.dismiss('cancel');
                }

                $scope.save = function(valid) {
                    if (valid) {
                        chainOrderEditService.cancelInvoice($scope.order, function(data, status, headers, config) {
                            if (data.res) {
                                $scope.queryChainOrdersDetail({
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