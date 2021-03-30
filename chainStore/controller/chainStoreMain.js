app.factory('chainStoreMainService', function (baseHttp) {
    return {
        queryVendor: function (params, callback) {
            return baseHttp.service('api_app/queryVendor', params, callback);
        },
        queryVendorList: function (params, callback) {
            return baseHttp.service('api_app/queryVendorList', params, callback);
        },
        saveVendorRelation: function (params, callback) {
            return baseHttp.service('api_app/saveVendorRelation', params, callback);
        },
        queryVendorRelationList: function (params, callback) {
            return baseHttp.service('api_app/queryVendorRelationList', params, callback);
        }
    }
});
/**
 * 連鎖分店管理
 * 
 */
app.controller('chainStoreMainController', function ($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, chainStoreMainService, formUtil, tableUtil, util, storageUtil) {

    var currentUser = storageUtil.getItem('currentUser');
    $scope.searchCondition = { "vendorRelationType": 2, "vendorNameProvider": null, "taxId": null, "vendorCode": null, "vendorIdProvider": currentUser.vendor.vendorId };

    var columns_table = [
        { title: "店家名稱", data: "vendorNameBuyer", sWidth: "15%" },
        {
            title: "店家種類", data: null, sWidth: "10%",
            render: function (data, type, row, meta) {
                var dataStr = $filter('vendorTypeName')(data.vendorTypeBuyer);
                return dataStr;
            }
        },
        {
            title: "狀態", data: null, sWidth: "10%",
            render: function (data, type, row, meta) {
                var dataStr = $filter('vendorStatusName')(data.vendorRelationStatus);
                return dataStr;
            }
        },
        { title: "統編", data: "taxIdBuyer", sWidth: "10%" }
    ];

    var js = {
        title: "操作", data: null, sWidth: "25%", "bSortable": false, render: function (data, type, full, meta) {
            var btnStr = '<button name="edit_merchant" class="btn btn-sm btn-edit " value="' + meta.row + '"><i class="ace-icon fa fa-pencil-square-o"></i>檢視</button>'
            // if ($rootScope.rootUser.adminType < 2) {

            if (full.vendorIdAccept == currentUser.vendor.vendorId && full.vendorRelationStatus == 0) {
                btnStr += '<button name="approve_merchant" class="btn btn-sm btn-save margin_left" value="' + meta.row + '">審核通過</button>';
                btnStr += '<button name="delete_merchant" class="btn btn-sm btn-save margin_left" value="' + meta.row + '">審核不通過</button>'
            } else if (full.vendorRelationStatus == 99) {
                btnStr += '<button name="delete_merchant" class="btn btn-sm btn-dele margin_left" value="' + meta.row + '"><i class="ace-icon fa fa-trash-o"></i>刪除</button>';
            }
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
        data: $scope.vendorRelationList,
        "scrollX": "100%",
        columns: columns_table,
    };

    var dataTable = $('#data_table').DataTable(opt_table);

    $scope.queryVendorRelationList = function (param) {
        chainStoreMainService.queryVendorRelationList(param, function (data, status, headers, config) {
            if (data.res) {
                $scope.vendorRelationList = data.data;
                util.refreshDataTable(dataTable, $scope.vendorRelationList);
            }
        })
    };


    $scope.searchData = function () {
        $scope.queryVendorRelationList($scope.searchCondition);
    };

    $scope.searchData();

    $('#data_table tbody').on('click', 'button[name="edit_merchant"]', function () {
        var index = $(this).val();
        var vendor = $scope.vendorRelationList[index];

        let param = { 'vendorId': vendor.vendorIdBuyer };
        chainStoreMainService.queryVendor(param, function (data, status, headers, config) {

            if (data.res) {
                data.data.vendorType = $filter('vendorTypeName')(data.data.vendorType);
                $scope.openPopoverView(data.data);
            } else {
                util.alert(data.message);
            }
        })

    });

    $('#data_table tbody').on('click', 'button[name="delete_merchant"]', function () {
        var index = $(this).val();
        var merchant = $scope.vendorRelationList[index];
        $scope.saveMerchant(merchant, 88);
    });

    $('#data_table tbody').on('click', 'button[name="approve_merchant"]', function () {
        var index = $(this).val();
        var merchant = $scope.vendorRelationList[index];
        $scope.saveMerchant(merchant, 99);
    });

    $scope.saveMerchant = function (param, code) {
        let msg = '';
        if (param.vendorRelationStatus == 0 && code == 99) {
            msg = '確定審核通過?';
            param.vendorRelationStatus = 99;
        } else if (param.vendorRelationStatus == 0 && code == 88) {
            msg = '確定審核不通過?';
            param.vendorRelationStatus = 88;
        } else {
            msg = '確定要刪除?';
            param.vendorRelationStatus = 88;
        }
        util.confirm(msg, function (r) {
            if (r) {
                chainStoreMainService.saveVendorRelation(param, function (data, status, headers, config) {
                    if (data.res) {
                        $scope.cancel();
                        util.alert('成功!');
                        // $scope.search();
                    } else {
                        util.alert(data.message);
                    }
                })
            }
        })
    };

    $scope.addVendor = function () {
        var data = [];
        $scope.merchant = util.clone(data);
        $scope.disabled = true;
        var modalInstance = $modal.open({
            templateUrl: 'modules/vc/popover/view/addVendor.html',
            backdrop: 'static',
            scope: $scope,
            controller: function ($rootScope, chainStoreMainService, $scope, $window, $location, $http, $filter, $state, $modal, $modalInstance, util, storageUtil) {

                var currentUser = storageUtil.getItem('currentUser');

                $scope.cancel = function () {
                    $scope.inputDisabled = false;
                    $modalInstance.dismiss('cancel');
                }

                $scope.vendorCondition = { 'vendorCode': null };
                $scope.vendor = { 'taxId': null, 'contactTel': null, 'address': null, 'ownerName': null, 'description': null };

                $scope.searchVendor = function (valid) {
                    if (valid) {
                        $scope.queryVendorList($scope.vendorCondition);
                    } else {
                        util.alert('必填商家編號未輸入');
                    }
                };

                $scope.queryVendorList = function (param) {
                    chainStoreMainService.queryVendorList(param, function (data, status, headers, config) {

                        if (data.res) {
                            if (data.data.length != 1) {
                                util.alert('您查詢的廠商尚未註冊!');
                            } else {
                                $scope.vendor = data.data[0];
                            }
                        }
                    })
                };

                $scope.createVendor = function (isFake) {
                    $state.go('vendorRegister', { "fn": 'chainStoreMain', "isFake": isFake, "vendorType": 3 });
                    $modalInstance.dismiss('close');
                };

                $scope.approve = function (setting) {
                    let param = { "vendorIdAccept": $scope.vendor.vendorId, "vendorRelationType": 2, "vendorIdProvider": currentUser.vendor.vendorId, "vendorIdBuyer": $scope.vendor.vendorId, "vendorIdApply": currentUser.vendor.vendorId, "userIdApply": currentUser.userId, "vendorRelationStatus": 0 };

                    chainStoreMainService.queryVendorRelationList(param, function (data, status, headers, config) {
                        if (data.data.length > 0) {
                            util.alert('雙方已建立合作關係囉!!');
                        } else {
                            util.confirm('是否確定加入', function (r) {
                                if (r) {
                                    if (currentUser.vendor.vendorId != $scope.vendor.vendorId && $scope.vendor.vendorId != null) {

                                        chainStoreMainService.saveVendorRelation(param, function (data, status, headers, config) {
                                            if (data.res) {
                                                $scope.cancel();
                                                //util.alert('送出成功!');
                                                $scope.disabled = false;
                                                $scope.searchData();
                                            } else {
                                                util.alert(data.message);
                                            }
                                        })

                                    } else {
                                        util.alert('廠商不能加自己的廠商');
                                    }
                                }
                            })
                        }
                    })
                };
            }
        })

    };

    $scope.openPopoverView = function (data) {

        $scope.merchant = util.clone(data);
        $scope.disabled = true;


        if ($scope.merchant.isFake == 1) {
            $scope.merchant.isFake = false;
        } else {
            $scope.merchant.isFake = true;
        }

        var modalInstance = $modal.open({
            templateUrl: 'modules/vc/popover/view/editMerchan.html',
            backdrop: 'static',
            scope: $scope,
            controller: function ($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, $modalInstance, util, vendorMainService) {

                $scope.cancel = function () {
                    $scope.inputDisabled = false;
                    $modalInstance.dismiss('cancel');
                }

                //儲存修改
                $scope.save = function (valid) {
                    util.confirm('是否儲存廠商資料?', function (r) {
                        if (r) {
                            if ($scope.merchant.isFake) {
                                $scope.merchant.isFake = 1;
                            } else {
                                $scope.merchant.isFake = 0;
                            }
                            if (valid) {
                                let param = { 'vendor': $scope.merchant }
                                param.vendor.vendorType = 3;
                                vendorMainService.approveVipInfo(param, function (data, status, headers, config) {
                                    if (data.res) {
                                        $scope.cancel();
                                        $scope.disabled = false;
                                    } else {
                                        util.alert(data.msg);
                                    }
                                    $scope.loading = false;
                                })
                            }
                        }
                    })
                }
            }
        });

    }



});
