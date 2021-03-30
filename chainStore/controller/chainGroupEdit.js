app.factory('chainGroupEditService', function (baseHttp) {
    return {
        queryVendorGroup: function (params, callback) {
            return baseHttp.service('api_app/queryVendorGroup', params, callback);
        },
        saveVendorGroup: function (params, callback) {
            return baseHttp.service('api_app/saveVendorGroup', params, callback);
        },
        queryProvider: function (params, callback) {
            return baseHttp.service('api_app/queryVendorRelationList', params, callback);
        },
    }
});

/**
 * 連鎖群組管理
 * 
 */
app.controller('chainGroupEditController', function ($stateParams, $rootScope, $scope, $window, $location, $http, $filter, $state, $modal, $document, chainGroupEditService, formUtil, tableUtil, util, storageUtil) {

    $scope.currentUser = storageUtil.getItem('currentUser');

    $scope.groupId = $stateParams.groupId;

    $scope.vendorGroupView = {};

    $scope.currentVendorId = storageUtil.getItem('currentUser').vendor.vendorId;

    $scope.providerList = [];
    $scope.warehouseList = [];

    $scope.headquartersIsBuyer;

    var providerArray = [];
    var warehouseArray = [];
    
    var param = { "dictionaryId": $scope.groupId, "vendorId": $scope.currentVendorId };
    chainGroupEditService.queryVendorGroup(param, function (data, status, headers, config) {
        if (data.res) {
            $scope.vendorGroupView = data.data
            console.log(data.data);
            if (data.data.headquartersIsBuyer) {
                $scope.headquartersIsBuyer = 1;
            } 

            for (var i = 0; i < data.data.providerGroupList.length; i++){
                if(data.data.providerGroupList[i].active ==1){
                    providerArray.push(data.data.providerGroupList[i].vendorName);
                }
            }
            for (var i =0; i< data.data.warehouseList.length; i++){
            	warehouseArray.push(data.data.warehouseList[i]);
            }
            $scope.warehouseList= warehouseArray;
            console.log($scope.warehouseList)
        } else {
            // util.alert(data.message);
            //  $window.history.back();
        }
    })

    // -----  供貨商列表   ------  
    var param = { "vendorRelationType": 1, "vendorIdBuyer": $scope.currentVendorId };
    chainGroupEditService.queryProvider(param, function (data, status, headers, config) {
        if (data.res) {
        	setTimeout(() => { for(var i = 0; i< data.data.length; i++){
                for(var j = 0; j< providerArray.length; j++){
                    if(data.data[i].vendorNameProvider == providerArray[j]){
                        $scope.providerList.push(data.data[i]);
                        }
                    }
               }
           	 }, 1000);
        } else {

        }
    })

    $scope.changeTab = function () {
        util.refreshDataTable(dataTable3, $scope.vendorGroupView.productQuoteList);

        // Tab元件初始化造成DataTable Header的問題, 目前使用的Tab元件無法觸發show.bs.tab事件, 
        // 所以只能在Tab切換後, DOM載入完後再刷新DataTable欄位
        $document.ready(function () {
            $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
        });
    };

    $scope.pqActiveAll = false;
    $scope.pqActive = function () {
        if ($scope.pqActiveAll == false) {
            for (var i = 0; i < $scope.vendorGroupView.productQuoteList.length; i++) {
                $scope.vendorGroupView.productQuoteList[i].active = 1
                if ($scope.vendorGroupView.productQuoteList[i].priceProvider == null) {
                    $scope.vendorGroupView.productQuoteList[i].priceProvider = $scope.vendorGroupView.productQuoteList[i].price;
                }
                
            }
        } else if ($scope.pqActiveAll == true) {
            for (var i = 0; i < $scope.vendorGroupView.productQuoteList.length; i++) {
                $scope.vendorGroupView.productQuoteList[i].active = 0
            }
        }
    }

    $scope.select = function(index){
    	console.log("xxxxx");
    	console.log(index);
    }

    $scope.saveGroup = function (valid) {
        util.confirm('是否儲存群組資料?', function (r) {
            if (r) {
                if (valid) {
                    //另外整理儲存資料給Server => vendorGroupViewSave
                    var vendorGroupViewSave = {};
                    vendorGroupViewSave.dictionaryId = $scope.vendorGroupView.dictionaryId;
                    vendorGroupViewSave.groupNmae = $scope.vendorGroupView.groupNmae;
                    vendorGroupViewSave.groupCode = $scope.vendorGroupView.groupCode;
                    vendorGroupViewSave.groupRemark = $scope.vendorGroupView.groupRemark;
                    vendorGroupViewSave.vendorId = $scope.vendorGroupView.vendorId;
                    
                    var providerGroupListActive = [];
                    for (var i = 0; i < $scope.vendorGroupView.providerGroupList.length; i++) {
                        if ($scope.vendorGroupView.providerGroupList[i].active == 1) {
                            $scope.vendorGroupView.providerGroupList[i].dictionaryId = $scope.vendorGroupView.dictionaryId;
                            $scope.vendorGroupView.providerGroupList[i].vendorGroupType = 1;
                            providerGroupListActive.push($scope.vendorGroupView.providerGroupList[i]);
                        }
                    }
                    vendorGroupViewSave.providerGroupList = providerGroupListActive;

                    var storeGroupListActive = [];
                    for (var i = 0; i < $scope.vendorGroupView.storeGroupList.length; i++) {
                        if ($scope.vendorGroupView.storeGroupList[i].active == 1) {
                            $scope.vendorGroupView.storeGroupList[i].dictionaryId = $scope.vendorGroupView.dictionaryId;
                            $scope.vendorGroupView.storeGroupList[i].vendorGroupType = 2;
                            storeGroupListActive.push($scope.vendorGroupView.storeGroupList[i]);
                        }
                    }
                    if ($scope.headquartersIsBuyer == 1) {
                        let store = { dictionaryId: $scope.vendorGroupView.dictionaryId, vendorGroupType: 2, vendorId: $scope.currentVendorId };
                        storeGroupListActive.push(store);
                    }
                    vendorGroupViewSave.storeGroupList = storeGroupListActive;

                    var productQuoteListActive = [];
                    for (var i = 0; i < $scope.vendorGroupView.productQuoteList.length; i++) {
                        if ($scope.vendorGroupView.productQuoteList[i].active == 1) {

                            if ($scope.vendorGroupView.productQuoteList[i].priceProvider === null) {
                                util.alert('請輸入[ ' + $scope.vendorGroupView.productQuoteList[i].productName + " ]進貨價");
                                return null;
                            }
                        }
                        $scope.vendorGroupView.productQuoteList[i].vendorNameProvider = $scope.vendorGroupView.productQuoteList[i].vendorIdProvider;
                        $scope.vendorGroupView.productQuoteList[i].vendorId = $scope.vendorGroupView.vendorId;
                        $scope.vendorGroupView.productQuoteList[i].vendorIdBuyer = $scope.vendorGroupView.dictionaryId;
                        $scope.vendorGroupView.productQuoteList[i].productQuoteType = 2;
                        $scope.vendorGroupView.productQuoteList[i].vendorId = $scope.vendorGroupView.vendorId;
                        $scope.vendorGroupView.productQuoteList[i].updatedBy = $scope.currentUser.userId;
                        $scope.vendorGroupView.productQuoteList[i].warehouseId = $scope.vendorGroupView.productQuoteList[i].warehouseId;
                        $scope.vendorGroupView.productQuoteList[i].helpReceive = $scope.vendorGroupView.productQuoteList[i].helpReceive;
                        productQuoteListActive.push($scope.vendorGroupView.productQuoteList[i]);
                    }

                    vendorGroupViewSave.productQuoteList = productQuoteListActive;
                    console.log(vendorGroupViewSave);
                    chainGroupEditService.saveVendorGroup(vendorGroupViewSave, function (data, status, headers, config) {
                        if (data.res) {
                            util.alert('儲存成功!');
                            // $scope.search();
//                            $state.go('chainGroupMain');
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

});
