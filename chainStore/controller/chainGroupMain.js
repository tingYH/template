app.factory('chainGroupMainService', function (baseHttp) {
	 return {
		    queryGroupeList: function (params, callback) {
	            return baseHttp.service('api_app/queryProductTypeList', params, callback);
	        },
	        saveGroup: function (params, callback) {
	            return baseHttp.service('api_app/saveProductType', params, callback);
	        },
	        deleteGroupe: function (params, callback) {
	            return baseHttp.service('api_app/deleteProductType', params, callback);
	        }
	    }
});

/**
 * 連鎖群組管理
 * 
 */
app.controller('chainGroupMainController', function ($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, chainGroupMainService, formUtil, tableUtil, util ,storageUtil) {

    $scope.currentVendorId = storageUtil.getItem('currentUser').vendor.vendorId;
    
	$scope.searchCondition = { 'dictionaryName': '', 'dictionaryCode': '' , 'dictionaryType':2 , 'vendorId' : $scope.currentVendorId };

    var columns_table = [
        { title: "群組名稱", data: "dictionaryName", sWidth: "30%" },
        { title: "群組代碼", data: "dictionaryCode", sWidth: "20%" },
        { title: "說明", data: "remark", sWidth: "20%" }
    ];

    var js = {
        title: "操作", data: null, sWidth: "30%", "bSortable": false, render: function (data, type, full, meta) {
            var btnStr = '<button name="edit_group" class="btn btn-sm btn-edit margin" value="' + meta.row + '"><i class="ace-icon fa fa-pencil-square-o"></i>編輯</button>'
            btnStr += '<button name="delete_group" class="btn btn-sm btn-dele margin_left" value="' + meta.row + '"><i class="ace-icon fa fa-trash-o"></i>刪除</button>';
            return btnStr;
        }
    };

    columns_table.push(js);

	    var opt_table = {
	        "oLanguage": { "sUrl": "dataTables.zh-tw.txt" },
	        "bJQueryUI": true,
	        select: false,
	        "sPaginationType": 'full_numbers',
	        data: $scope.groupList,
	        "scrollX": "100%",
	        columns: columns_table,
	        "order": [[1, 'desc']]
	    };

	    var dataTable = $('#data_table').DataTable(opt_table);

	    $scope.queryGroupeList = function (param) {
	        chainGroupMainService.queryGroupeList(param, function (data, status, headers, config) {
	            if (data.res) {
	                $scope.groupList = data.data;
	                util.refreshDataTable(dataTable, $scope.groupList);
	            }
	        })
	    };


	    $scope.searchGroup = function () {
	        $scope.queryGroupeList($scope.searchCondition);
	       
	    };
	    
	    $scope.searchGroup();


	    $('#data_table tbody').on('click', 'button[name="edit_group"]', function () {
	        var index = $(this).val();
	        var group = $scope.groupList[index];
	        $state.go('chainGroupEdit', { "groupId": group.dictionaryId, "fn": 1 });
	    });

	    $('#data_table tbody').on('click', 'button[name="delete_group"]', function () {
	        var index = $(this).val();
	        var group = $scope.groupList[index];

	        util.confirm('確定要刪除 <font color="red">' + group.dictionaryName + '</font>', function (r) {
	            if (r) {
	                chainGroupMainService.deleteGroupe(group, function (data, status, headers, config) {
	                    if (data.res) {
	                        util.alert("刪除成功");
	                        location.reload();
	                    } else {
	                        util.alert(data.message);
	                    }
	                })
	            }
	        })
	    });


	    $scope.addGroup = function () {
	        var group = { "vendorId": $scope.currentVendorId , "dictionaryType": 2, "dictionaryCode" : '', "dictionaryName" : '', "dictionaryOrder": 0 };
	        $scope.openPopoverView(group);
	    }

	    $scope.openPopoverView = function (data) {
	        $scope.group = util.clone(data);
	        $scope.disabled = true;
	        var modalInstance = $modal.open({
	            templateUrl: 'modules/vc/popover/view/editGroup.html',
	            backdrop: 'static',
	            scope: $scope,
	            controller: function ($rootScope, $scope, $window, $location, $http, $filter, $state, $modal, $modalInstance, util) {
	                $scope.cancel = function () {
	                    $scope.inputDisabled = false;
	                    $modalInstance.dismiss('cancel');
	                }

	                $scope.save = function (valid) {
	                    util.confirm('是否確定新增群組?', function (r) {
	                        if (r) {
	                            if (valid) {
	                                chainGroupMainService.saveGroup($scope.group, function (data, status, headers, config) {
	                                    console.log(data);
	                                    if (data.res) {
	                                        $scope.cancel();
	                                        $scope.group = data.data;
	                                        util.alert('建立群組成功');
//	                                        $state.go('chainGroupEdit', { "groupId": $scope.group.dictionaryId , "fn": 1 });
	                                        location.reload();
	                                        
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
