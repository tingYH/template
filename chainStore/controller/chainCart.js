app.factory('chainCartService', function (baseHttp) {
    return {
        separateOrders: function (params, callback) {
            return baseHttp.service('api_backend/separateOrders', params, callback);
        },
        saveOrders: function (params, callback) {
            return baseHttp.service('api_app/saveOrders', params, callback);
        }
    }
});
/**
 * 連鎖訂單轉購物車訂單
 * 
 */
app.controller('chainCartController', function ($rootScope, $scope, $window, $location, $http, $filter, $state, $stateParams, $modal, chainCartService, util, storageUtil, warehouseMainService) {

    $scope.orderId = $stateParams.orderId;
    let currentUser = storageUtil.getItem('currentUser');
    $scope.currentVendorId = storageUtil.getItem('currentUser').vendor.vendorId;
    $scope.vendorNameBuyer = $stateParams.vendorNameBuyer;
    $scope.ordersViewList = [];


    $scope.warehouseList = [{ warehouseId: 0, warehouseName: '本倉', address: currentUser.vendor.address }];

    let param = { vendorId: currentUser.vendor.vendorId, warehouseStatus: 99 }
    warehouseMainService.queryWarehouseList(param, function (data, status, headers, config) {
        if (data.res) {
            if (data.data != null && data.data.length > 0) {
                $scope.warehouseList = data.data;
                $scope.warehouseList.push({ warehouseId: 0, warehouseName: '本倉', address: currentUser.vendor.address });
            }
        }
    })


    $scope.change = function (cart, order) {
        console.log(cart.order);
        var filteredData = $scope.warehouseList.filter(function (response) {
            return response.warehouseId == cart.orders.warehouseId;
        })

        cart.orders.address = filteredData[0].address;
    }

    param = { "orderId": $scope.orderId, "updatedBy": currentUser.userId };
    chainCartService.separateOrders(param, function (data, status, headers, config) {
        if (data.res) {
            if (data.data.length == 0 || data.data == null) {
                util.alert('訂單都傳給其他供應商囉!');
                $state.go('chainOrderMain');
            }
            $scope.ordersViewList = data.data
            console.log(data.data);
        }
    });

    $scope.gotoOrderConfirm = function (index) {
        util.confirm('訂單確定送出?', function (r) {
            if (r) {
                if (1) {
                    let param = {
                        orders: $scope.ordersViewList[index].orders,
                        orderDetailList: $scope.ordersViewList[index].orderDetailList
                    }
                    chainCartService.saveOrders(param, function (data, status, headers, config) {
                        if (data.res) {
                            util.alert('送出成功!');
                            $scope.ordersViewList.splice(index, 1);
                            if ($scope.ordersViewList.length == 0) {
                                $state.go('chainOrderMain');
                            }
                        } else {
                            util.alert(data.message);
                        }
                        $scope.loading = false;
                    });

                } else {
                    util.alert('必填欄位未輸入');
                }

            }
        })

    }

    $scope.addBuyCount = function () {
        console.log('++++');
    }

    $scope.removeBuyCount = function () {
        console.log('----');
    }

    $scope.goBack = function () {
        $state.go('chainOrderMain');
    }

});
