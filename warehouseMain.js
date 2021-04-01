app.factory('warehouseMainService', function (baseHttp) {
    return {
        queryProductList: function (params, callback) {
            return baseHttp.service('api_app/queryProductList', params, callback);
        },
        queryWarehouseList: function (params, callback) {
            return baseHttp.service('api_app/queryWarehouseList', params, callback);
        },
        saveWarehouseItem: function (params, callback) {
            return baseHttp.service('api_app/saveWarehouseItem', params, callback);
        },
        queryWarehouseItem: function (params, callback) {
            return baseHttp.service('api_app/queryWarehouseItem', params, callback);
        },
        saveWarehouse: function (params, callback) {
            return baseHttp.service('api_app/saveWarehouse', params, callback);
        },
        deleteWarehouse: function (params, callback) {
            return baseHttp.service('api_app/deleteWarehouse', params, callback);
        }
    }
});

/**
 * 倉儲管理維護
 * 
 */
app.controller('warehouseMainController', function ($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, warehouseMainService, formUtil, util, storageUtil) {

    var currentUser = storageUtil.getItem('currentUser');
    $scope.currentVendorId = storageUtil.getItem('currentUser').vendor.vendorId;

    $scope.searchCondition = { vendorId: $scope.currentVendorId, warehouseName: null };
    $scope.warehouseList = [];

    var columns_table = [
        { title: "倉庫名稱", data: "warehouseName", sWidth: "25% " },
        { title: "地址", data: "address", sWidth: "30%" },
        { title: "單位負責人", data: "ownerName", sWidth: "10%" },
        { title: "連絡電話", data: "contactTel", sWidth: "10%" }
    ];

    var js = {
        title: "操作", data: null, sWidth: "25%", "bSortable": false, render: function (data, type, full, meta) {
            var btnStr = '<button name="edit_warehouse" class="btn btn-sm btn-edit " value="' + meta.row + '"><i class="ace-icon fa fa-pencil-square-o"></i>編輯</button>'
            // if ($rootScope.rootUser.adminType < 2) {
            btnStr += '<button name="delete_warehouse" class="btn btn-sm btn-dele margin_left" value="' + meta.row + '"><i class="ace-icon fa fa-trash-o"></i>刪除</button>';
            btnStr += '<button name="query_warehouse" class="btn btn-sm btn-dele margin_left" value="' + meta.row + '"><i class="ace-icon fa fa-trash-o"></i>看看</button>';
            btnStr += '<button name="add_warehouse" class="btn btn-sm btn-dele margin_left" value="' + meta.row + '"><i class="ace-icon fa fa-trash-o"></i>新增</button>';


            // }
            return btnStr;
        }
    };

    // if ($rootScope.rootUser.adminType < 2) {
    columns_table.push(js);
    // }

    var opt_table = {
        "oLanguage": { "sUrl": "dataTables.zh-tw.txt" },
        "bJQueryUI": true,
        select: false,
        "sPaginationType": 'full_numbers',
        data: $scope.warehouseList,
        "scrollX": "100%",
        columns: columns_table
    };
    var dataTable = $('#data_table').DataTable(opt_table);

    $scope.queryWarehouseList = function (param) {
        warehouseMainService.queryWarehouseList(param, function (data, status, headers, config) {
            if (data.res) {
                $scope.warehouseList = data.data;
                console.log(data.data);
                util.refreshDataTable(dataTable, $scope.warehouseList);
            }
        })
    };



    $scope.searcWarehouse = function () {
        $scope.queryWarehouseList($scope.searchCondition);
    };

    $scope.searcWarehouse();


    $('#data_table tbody').on('click', 'button[name="edit_warehouse"]', function () {
        var index = $(this).val();
        var warehouse = $scope.warehouseList[index];
        $scope.openPopoverView(warehouse);
    });

    $('#data_table tbody').on('click', 'button[name="delete_warehouse"]', function () {
        var index = $(this).val();
        var warehouse = $scope.warehouseList[index];

        util.confirm('確定要刪除 <font color="red">' + warehouse.warehouseName + '</font>', function (r) {
            if (r) {
                warehouseMainService.deleteWarehouse(warehouse, function (data, status, headers, config) {
                    if (data.res) {
                        util.alert("刪除成功");
                    } else {
                        util.alert(data.message);
                    }
                })
            }
        })

    });
    
    $('#data_table tbody').on('click', 'button[name="query_warehouse"]', function () {
        var index = $(this).val();
        var warehouse = $scope.warehouseList[index];
    	console.log(warehouse);
        warehouseMainService.queryWarehouseItem(warehouse, function (data, status, headers, config){
        	console.log(data.data);
        });

    });
    
    let param = { "dictionaryType": 1, "vendorId": $scope.currentVendorId };
    $('#data_table tbody').on('click', 'button[name="add_warehouse"]', function () {
        var index = $(this).val();
        //Query商品的List
        warehouseMainService.queryProductList(param, function (data, status, headers, config) {
            if (data.res) {
                $scope.productList = data.data;
                console.log($scope.productList);
            }
        });
        //新增
//        var warehouse = {id:null,quantity:10.00,warehouseId:3,vednorId:221,productId:218,enable:1,updatedBy:1,itemUnit:"箱"};
    	
        //更新的部分需要有id
//        var warehouse = {id:3,quantity:10.00,warehouseId:3,vednorId:221,productId:218,enable:1,updatedBy:1,itemUnit:"箱"};
//        console.log(warehouse);
//        warehouseMainService.saveWarehouseItem(warehouse, function (data, status, headers, config){
//        	console.log(data.data);
//        });

    });	

    $scope.addWarehouse = function () {
        var warehouse = { warehouseId: null, vendorId: $scope.currentVendorId, warehouseStatus: 99, warehouseCode: 1, warehouseName: null, ownerName: null, contactName: null, contactTel: null, contactPhone: null, contactPhone: null, contactEmail: null, address: null, remark: null };
        $scope.openPopoverView(warehouse);
    }

    $scope.openPopoverView = function (data) {
        $scope.warehouse = util.clone(data);
        $scope.disabled = true;
        var modalInstance = $modal.open({
            templateUrl: 'modules/vc/popover/view/editWarehouse.html',
            backdrop: 'static',
            scope: $scope,
            controller: function ($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, $modalInstance, util) {
                $scope.cancel = function () {
                    $scope.inputDisabled = false;
                    $modalInstance.dismiss('cancel');
                }

                $scope.save = function (valid) {
                    util.confirm('是否確定儲存倉儲管理?', function (r) {
                        if (r) {
                            if (valid) {
                                warehouseMainService.saveWarehouse($scope.warehouse, function (data, status, headers, config) {
                                    console.log(data);
                                    if (data.res) {
                                        $scope.cancel();
                                        //util.alert('送出成功!');
                                        $scope.disabled = false;
                                        $scope.searcWarehouse();
                                    } else {
                                        util.alert(data.message);
                                    }
                                    $scope.loading = false;
                                })
                            } else {
                                util.alert('必填欄位未輸入');
                            }
                        }
                    })
                }
            }
        })
    }

});