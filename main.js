var ERROR_MSG = {
	'ERR_USER_MOBILE_MUST_HAVE':'{"state":"error", "code":0, "msg":"手机号不能为空"}', 
	'ERR_USER_PASSWORD_MUST_HAVE':'{"state":"error", "code":1, "msg":"密码不能为空"}', 
	'ERR_USER_EXITS':'{"state":"error", "code":2, "msg":"用户已存在"}', 
	'ERR_MONTH_NOT_PREORDER':'{"state":"error", "code":3, "msg":"当月无可预约时间}',
	'ERR_PREORDER_SLOW':'{"state":"error", "code":4, "msg":"当前日期已被预约，您来晚一步"}', 
	'ERR_DATE_LOCK_FAILED':'{"state":"error", "code":5, "msg":"日期锁定失败"}', 
	'ERR_DATE_UNLOCK_NOHAVE':'{"state":"error", "code":6, "msg":"日期解锁失败, 日期不存在"}', 
	'ERR_DATE_UNLOCK_FAILED':'{"state":"error", "code":7, "msg":"日期解锁失败, 日期已被解锁"}',
	'ERR_USERID_MUST_HAVE':'{"state":"error", "code":8, "msg":"用户ID必填"}', 
	'ERR_LOCK_DATE_NO_CONTINUE':'{"state":"error", "code":9, "msg":"加锁日期不连续"}', 
	'ERR_UNLOCK_DATE_NO_CONTINUE':'{"state":"error", "code":10, "msg":"解锁日期不连续"}', 
	'ERR_LOCK_DATE_MUST_HAVE':'{"state":"error", "code":11, "msg":"加锁日期必填"}', 
	'ERR_TIME_NO_UNLOCK':'{"state":"error", "code":12, "msg":"所选时间段不能被解锁"}', 
	'ERR_TIME_NO_LOCK':'{"state":"error", "code":13, "msg":"所选时间段不能被锁定"}',
	'ERR_LOCK_UNLOC_NO_MATCHING':'{"state":"error", "code":14, "msg":"所选时间段锁定与解锁不匹配"}',
	'ERR_DATE_STYLE':'{"state":"error", "code":15, "msg":"时间样式错误"}',
	'ERR_UNLOCK_DATE_OVERDUE':'{"state":"error", "code":16, "msg":"解锁时间样已过期"}',
	'ERR_MODE_STYLE':'{"state":"error", "code":17, "msg":"模式样式错误"}',
	'ERR_MODE_MUST_HAVE':'{"state":"error", "code":18, "msg":"时间请求模式必须有"}'
}; 

var RESULT_MSG = {
    'RET_FAIL':'{"state":"failed", "code":0, "msg":"失败"}',
    'RET_OK':'{"state":"ok", "code":1, "msg":"成功"}'
};

/**
* brief   : 用户注册
* @param  : request - {"mobilePhoneNumber":"13xxxxxxxxx",
*           "password":"xxxxxx", "username":"xxxx"}
*           response - RET_OK or ERROR
* @return : RET_OK - success
*           ERROR  - system error
*/
AV.Cloud.define('kaka_register', function(request, response) {
	var mobile = request.params.mobilePhoneNumber;
	var password = request.params.password;
	var username = request.params.username;

    if (typeof(mobile) == "undefined" || mobile.length === 0) {
        response.success(ERROR_MSG.ERR_USER_MOBILE_MUST_HAVE);
        return;
    }
    
    if (typeof(password) == "undefined" || password.length === 0) {
        response.success(ERROR_MSG.ERR_USER_PASSWORD_MUST_HAVE);
        return;
    }

	var user = AV.Object.extend("_User");
	var query = new AV.Query(user);
	query.equalTo("mobilePhoneNumber", mobile);
	query.find({
		success :function(results) {
			if (typeof(results) == "undefined" || results.length === 0){
				var user_obj = new AV.User();
			     
                if (typeof(username) == "undefined" || username.length === 0) {
                    user_obj.set("username", request.params.mobilePhoneNumber);
                }
			    user_obj.set("mobilePhoneNumber", request.params.mobilePhoneNumber);
			    user_obj.set("password", request.params.password);
                user_obj.signUp(null, {
                    success: function(user_obj) {
                        response.success(RESULT_MSG.RET_OK);
                    },
                    error: function(user_obj, error) {
                        response.error(error);
                    }
                });
                
                return;
            }

			// 用户存在
			var user_obj = results[0];
			if (user_obj.get("mobilePhoneVerified")) {
				// 手机号已经验证
				// 返回错误信息
				response.success(ERROR_MSG.ERR_USER_EXITS);
                return;
			}
            else {
				// 手机号未验证
				// 更新密码
				user_obj.set("password", request.params.password);
				user_obj.save(null , {
					success :function(user) {
						// 发送手机号验证短信
						AV.User.requestMobilePhoneVerify(request.params.mobilePhoneNumber).then(
                        function(){
						   //发送成功
						   response.success(RESULT_MSG.RET_OK);
						}, 
                        function(error){
						   //发送失败
						   response.error(error);
						});
					},
					error:function(user, error){
						response.error(error);
					}
				});	
			}
		},
		error:function(error){
			response.error(error);	
		}
	})
});

/**
* brief   : 获取摄影师选定月份已被预约时间
* @param  : request - {"user_id":"xxxxxxxxxxxxxxx", "date":"201506}}
*           response - return
* @return : results -query result array
*           ERROR  - system error or define error
*/
AV.Cloud.define('kaka_get_workertime', function(request, response) {
	var date = request.params.date;
    var date_split = date.split("-");
	var year_month = parseInt(date_split[0] * 100) + parseInt(date_split[1]);
	var worker_time = AV.Object.extend("kaka_worker_time");
	var worker = AV.Object.extend("_User");
	var user = new worker();
	var query = new AV.Query(worker_time);

    user.id = request.params.user_id;
	query.equalTo("worker", user);
	query.equalTo("year_month", year_month);
	query.equalTo("preorder", 1);
	query.find({
	    success : function(results) {
		    // 查询条数为0时，提示无可预约时间
		    if(results.length === 0){
			     response.success(ERROR_MSG.ERR_MONTH_NOT_PREORDER);
			     return;
		    }
		
		    response.success(results);
	     },
	     error : function(error) {
             response.error(error);
	     }
	});  
});

/**
* brief   : 获取摄影师集合
* @param  : request - {}
*           response - return
* @return : results -query result array
*           ERROR  - system error or define error
*/
AV.Cloud.define('kaka_get_worker_cameraman', function(request, response) {
    var role_collection = AV.Object.extend("_Role");
    var role_obj = new role_collection();
	var worker_query = new AV.Query("_User");

    role_obj.id = "555c2a42e4b0b7e69366bff2";
    worker_query.equalTo("role", role_obj);
    worker_query.include('icon');
    
    worker_query.find ({
        success : function(results) {
            var result_num = results.length;
            for (var i = 0; i < result_num; i++) {
                results[i].set("icon", JSON.stringify(results[i].get('icon')));
            }

            response.success(results);
        },
        error : function(error) {
            response.error(error);
        }
    });
});

/**
* brief   : 获取日期相差天数
* @param  : date_1 - "2015-06-01"
*           date_2 - "2015-06-02"
* @return : number - days number
*/
var get_date_diff_number = function(date_1 , date_2) {
    var date, date1, date2, number;
    date = date_1.split("-"); 
    //转换为MM-dd-yyyy格式    
    date1 = new  Date(date[1] + '-' + date[2] + '-' + date[0]);

    date = date_2.split("-");   
    date2 = new  Date(date[1] + '-' + date[2] + '-' + date[0]);
    //把相差的毫秒数转换为天数 
    number = parseInt(Math.abs(date1 - date2) / 1000 / 60 / 60 / 24);
    return number;
}

/**
* brief   : 日期连续性验证
* @param  : dates - ["2015-06-01", "2015-06-02"]
* @return : true  - continue or 0
*           false - no continue
*/
var check_continuous_date = function(dates) {
	var dates_num = dates.length;
	for (var i = 0; i < dates_num - 1; i++) {
		if (get_date_diff_number(dates[i], dates[i + 1]) != 1) {
			return false;
		}
	}

	return true;
}

/**
* brief   : 请求参数验证
* @param  : request - {"user_id" : "555c2822e4b0b7e69366b104","unlock_dates":
*           ["2015-06-01","2015-06-02"],"lock_dates":["2015-06-28","2015-06-29"],
*           "mode":"sync"}
*           request - define error
* @return : true  - success
*           false - define error
*/
var check_request_params_style = function(request, response) {
    var params = request.params;
    var lock_date_num = params.lock_dates.length;
    var unlock_date_num = params.unlock_dates.length;
    // 用户ID必填
    if (typeof(params.user_id) == "undefined" || params.user_id.length === 0) {
        response.success(ERROR_MSG.ERR_USERID_MUST_HAVE);
        return false;
    }

    // 解锁日期可选
    if (typeof(params.unlock_dates) != "undefined") { 
        if (!check_continuous_date(params.unlock_dates)) {
            response.success(ERROR_MSG.ERR_UNLOCK_DATE_NO_CONTINUE);
            return false;
        }
    } 

    // 加锁日期必填
    if (typeof(params.lock_dates) != "undefined") {
        if (lock_date_num === 0) {
            response.success(ERROR_MSG.ERR_LOCK_DATE_MUST_HAVE);
            return false;
        }

        if (!check_continuous_date(params.lock_dates)) {
            response.success(ERROR_MSG.ERR_LOCK_DATE_NO_CONTINUE);
            return false;
        }
    }
    else {
        response.success(ERROR_MSG.ERR_DATE_STYLE);
        return false;
    }

    return true;
};

/**
* brief   : 同步(异步)摄影师多个日期加解锁
* @param  : request - {"user_id" : "555c2822e4b0b7e69366b104","unlock_dates":
*           ["2015-06-01","2015-06-02"],"lock_dates":["2015-06-28","2015-06-29"],
*           "mode":"sync"}
*           request - define error, result or system error
*           {"result":"{"state":"error","code":2,"msg":"当前日期已被预约，您来晚一步"}"}
* @return : success - RET_OK
*           error - define error or system error
*/
AV.Cloud.define('kaka_set_workertime_lock', function(request , response) {
	// 先加锁，后解锁
	// 如果解锁日期为空，则不解锁
	// 加锁日期为必填
	
	// 1. 查询摄影师加锁日期是否存在
	//    1. 存在，判断是否加锁
	//       1. 加锁，返回错误 -- 已被预约
	//       2. 解锁，直接加锁
	//          1. 加锁结果大于 1，则将此值修改为1，返回错误
	//          1. 加锁结果等于 1， 返回正常
	//    2. 不存在，直接添加一条加锁的预约时间
 
	var async_workertime_unlock_promise = function(unLock_dates) {
		return new AV.Promise(function(resolve, reject) { 
            var async_workertime_unlock = function(unlock_dates) {
                var state_code = 0;
                var unlock_date_num = unlock_dates.length;
                var unlock_date_array = [];

                if (typeof(unlock_dates) == "undefined") {
                    resolve(ERROR_MSG.ERR_DATE_STYLE);
                }
                else {
                    if (lock_date_num === 0) {
			            resolve(ERROR_MSG.ERR_LOCK_DATE_MUST_HAVE);
                    }
                }

                for(var i = 0 ; i < unlock_date_num ; i++){
                    unlock_date_array[i] = unlock_dates[i];
                    unlock_date_array[i] = parseInt(unlock_date_array[i].split("-").join(""));
                }

                var now_date = new Date();
                if (parseInt(unlock_date_array[0] / 100) < now_date.getFullYear() * 100 + now_date.getMonth() + 1) {
                    resolve(ERROR_MSG.ERR_UNLOCK_DATE_OVERDUE);
                }

                var user_collection = AV.Object.extend("_User");
                var user_obj = new user_collection();
                var kaka_worker_time_collection = AV.Object.extend('kaka_worker_time');
                var unlock_date_query = new AV.Query("kaka_worker_time");
                user_obj.id = request.params.user_id;
                unlock_date_query.equalTo("worker", user_obj);
                unlock_date_query.containedIn("date" , unlock_date_array);

                var worker_time = [];
                unlock_date_query.find ({
                    success : function(results) {
                        for (var i = 0; i < unlock_date_num; i++) {
                            if (results.length === 0) {
                                state_code = -1;
                                break;
                            }
                            else {
                                worker_time[i] = results[i];
                                var preorder = worker_time[i].get('preorder');
                                if (0 === preorder) {
                                    state_code = -2;
                                }
                                else {
                                    worker_time[i].set("preorder", 0); 
                                }
                            }
                        }

                        if (-1 == state_code) {
                            resolve(ERROR_MSG.ERR_DATE_UNLOCK_NOHAVE);
                        }

                        // 添加一天加锁的预约时间
                        AV.Object.saveAll(worker_time, { 
                            success : function(work_time) {
                                if (-2 == state_code) {
                                    resolve(ERROR_MSG.ERR_DATE_UNLOCK_FAILED);
                                }
                                else {
                                    resolve(RESULT_MSG.RET_OK);
                                }
                            }, 
                            error : function(work_time, error) {
                                //reject(ERROR_MSG.ERR_DATE_LOCK_FAILED);
                                reject(error);
                            }
                        });	 
                    }, 
                    error : function(error) {
                        reject(error);
                    }
                });
            };

            async_workertime_unlock(request.params.unlock_dates);
		});
	};

    var async_workertime_lock_promise = function(lock_dates) { 
        return new AV.Promise(function(resolve, reject) { 
            var async_workertime_lock = function(lock_dates) {
                var state_code = 0;
                var lock_date_num = lock_dates.length;
                var lock_date_array = [];

                if (typeof(lock_dates) == "undefined") {
                    resolve(ERROR_MSG.ERR_DATE_STYLE);
                }
                else {
                    if (lock_date_num === 0) {
			            resolve(ERROR_MSG.ERR_LOCK_DATE_MUST_HAVE);
                    }
                }

                for(var i = 0 ; i < lock_date_num ; i++){
                    lock_date_array[i] = lock_dates[i];
                    lock_date_array[i] = parseInt(lock_date_array[i].split("-").join(""));
                }

                var user_collection = AV.Object.extend("_User");
                var user_obj = new user_collection();
                var kaka_worker_time_collection = AV.Object.extend('kaka_worker_time');
                var lock_date_query = new AV.Query("kaka_worker_time");
                user_obj.id = request.params.user_id;
                lock_date_query.equalTo("worker", user_obj);
                lock_date_query.containedIn("date" , lock_date_array);

                var worker_time = [];
                lock_date_query.find ({
                    success: function(results) {
                        for (var i = 0; i < lock_date_num; i++) {
                            if (results.length === 0) {
                                worker_time[i] = new kaka_worker_time_collection();
                                worker_time[i].set("worker", user_obj);
                                worker_time[i].set("preorder", 1);
                                worker_time[i].set("date", lock_date_array[i]);
                                worker_time[i].set("year_month", parseInt(lock_date_array[i] / 100));
                                worker_time[i].set("days", lock_date_array[i] % 100);
                                worker_time[i].set("sure", 0);
                            }
                            else {
                                worker_time[i] = results[i];
                                var preorder = worker_time[i].get('preorder');
                                if (0 === preorder) {
                                    worker_time[i].increment("preorder"); 
                                }
                                else if (1 == preorder){
                                    state_code = -1;
                                }
                                else if(1 < preorder) {
                                    //workerTime.fetchWhenSave(true);
                                    worker_time[i].increment("preorder", -1);
                                    state_code = -2;
                                }
                            }
                        }

                        // 添加一天加锁的预约时间
                        AV.Object.saveAll(worker_time, { 
                            success : function(work_time) {
                                if (0 < state_code) {
                                    resolve(ERROR_MSG.ERR_PREORDER_SLOW);
                                }
                                else {
                                    resolve(RESULT_MSG.RET_OK);
                                }
                            }, 
                            error : function(work_time, error) {
                                //reject(ERROR_MSG.ERR_DATE_LOCK_FAILED);
                                reject(error);
                            }
                        });	 
                    }, 
                    error : function(error) {
                        reject(error);
                    }
                });
            };
        });
    };

    var sync_workertime_lock = function(lock_dates, single) {
        var state_code = 0;
        var lock_date_num = lock_dates.length;
        var lock_date_array = [];
        
        if (typeof(lock_dates) == "undefined") {
            response.success(ERROR_MSG.ERR_DATE_STYLE);
            return;
        }
        else {
            if (lock_date_num === 0) {
                response.success(ERROR_MSG.ERR_LOCK_DATE_MUST_HAVE);
                return; 
            }
        }

        for(var i = 0 ; i < lock_date_num ; i++){
			lock_date_array[i] = lock_dates[i];
			lock_date_array[i] = parseInt(lock_date_array[i].split("-").join(""));
		}

        var user_collection = AV.Object.extend("_User");
        var user_obj = new user_collection();
        var kaka_worker_time_collection = AV.Object.extend('kaka_worker_time');
		var lock_date_query = new AV.Query("kaka_worker_time");
        user_obj.id = request.params.user_id;
        lock_date_query.equalTo("worker", user_obj);
		lock_date_query.containedIn("date" , lock_date_array);

        var worker_time = [];
        lock_date_query.find ({
            success: function(results) {
                for (var i = 0; i < lock_date_num; i++) {
                    if (results.length === 0) {
                        worker_time[i] = new kaka_worker_time_collection();
                        worker_time[i].set("worker", user_obj);
                        worker_time[i].set("preorder", 1);
                        worker_time[i].set("date", lock_date_array[i]);
                        worker_time[i].set("year_month", parseInt(lock_date_array[i] / 100));
                        worker_time[i].set("days", lock_date_array[i] % 100);
                        worker_time[i].set("sure", 0);
                    }
                    else {
                        worker_time[i] = results[i];
                        var preorder = worker_time[i].get('preorder');
                        if (0 === preorder) {
                            worker_time[i].increment("preorder"); 
                        }
                        else if (1 == preorder){
                            state_code = -1;
                        }
                        else if(1 < preorder) {
                            //workerTime.fetchWhenSave(true);
                            worker_time[i].increment("preorder", -1);
                            state_code = -2;
                        }
                    }
                }

                // 添加一天加锁的预约时间
                AV.Object.saveAll(worker_time, { 
                    success : function(work_time) {
                        if (0 < state_code) {
                            response.success(ERROR_MSG.ERR_PREORDER_SLOW);
                        }
                        else {
                            if (single) {
                                response.success(RESULT_MSG.RET_OK);
                            }
                            else {
                                sync_workertime_unlock(request.params.unlock_dates);
                            }
                        }
                    }, 
                    error : function(work_time, error) {
                        //reject(ERROR_MSG.ERR_DATE_LOCK_FAILED);
                        response.error(error);
                    }
                });	 
            }, 
            error : function(error) {
                response.error(error);
            }
        });
	};
    
    var sync_workertime_unlock = function(unlock_dates) {
        var state_code = 0;
        var unlock_date_num = unlock_dates.length;
        var unlock_date_array = [];
        
        if (typeof(unlock_dates) == "undefined") {
            response.success(ERROR_MSG.ERR_DATE_STYLE);
            return;
        }
        else {
            if (unlock_date_num === 0) {
			    response.success(ERROR_MSG.ERR_LOCK_DATE_MUST_HAVE);
                return; 
            }
        }

        for(var i = 0 ; i < unlock_date_num ; i++){
			unlock_date_array[i] = unlock_dates[i];
			unlock_date_array[i] = parseInt(unlock_date_array[i].split("-").join(""));
		}

        var now_date = new Date();
        if (parseInt(unlock_date_array[0] / 100) < now_date.getFullYear() * 100 + now_date.getMonth() + 1) {
            response.success(ERROR_MSG.ERR_UNLOCK_DATE_OVERDUE);
            return
        }

        var user_collection = AV.Object.extend("_User");
        var user_obj = new user_collection();
        var kaka_worker_time_collection = AV.Object.extend('kaka_worker_time');
		var unlock_date_query = new AV.Query("kaka_worker_time");
        user_obj.id = request.params.user_id;
        unlock_date_query.equalTo("worker", user_obj);
		unlock_date_query.containedIn("date" , unlock_date_array);

        var worker_time = [];
        unlock_date_query.find ({
            success : function(results) {
                for (var i = 0; i < unlock_date_num; i++) {
                    if (results.length === 0) {
                        state_code = -1;
                        break;
                    }
                    else {
                        worker_time[i] = results[i];
                        var preorder = worker_time[i].get('preorder');
                        if (0 === preorder) {
                            state_code = -2;
                        }
                        else {
                            worker_time[i].set("preorder", 0); 
                        }
                    }
                }
 
                if (-1 == state_code) {
                    response.success(ERROR_MSG.ERR_DATE_UNLOCK_NOHAVE);
                    return;
                }
                
                // 添加一天加锁的预约时间
                AV.Object.saveAll(worker_time, { 
                    success : function(work_time) {
                        if (-2 == state_code) {
                            response.success(ERROR_MSG.ERR_DATE_UNLOCK_FAILED);
                        }
                        else {
                            response.success(RESULT_MSG.RET_OK);
                        }
                    }, 
                    error : function(work_time, error) {
                        //reject(ERROR_MSG.ERR_DATE_LOCK_FAILED);
                        response.error(error);
                    }
                });	 
            }, 
            error : function(error) {
                response.error(error);
            }
        });
	};
		
	/**
	* 加锁日期数据检查
	*
	*/
	var check_lock_dates = function(mode) {
        var lock_dates = request.params.lock_dates;
		var lock_date_len = lock_dates.length;
		var lock_date_params = [];

		for(var i = 0 ; i < lock_date_len ; i++){
			lock_date_params[i] = lock_dates[i];
			lock_date_params[i] = parseInt(lock_date_params[i].split("-").join(""));
		}

		var lock_date_query = new AV.Query("kaka_worker_time");
		lock_date_query.containedIn("date" , lock_date_params);
	
        lock_date_query.find({
            success : function(results) {
                if (results.length === 0) {
                    sync_workertime_lock(lock_dates, true);
                }
                else {
                    var results_num = results.length;
                    for (var i = 0; i < results_num ; i++) {
                        if (results[i].get('preorder') != 0) {
                            response.success(ERROR_MSG.ERR_TIME_NO_LOCK);
                            return;
                        }
                    }
                    check_unlock_dates(mode);
                }
            },
            error : function(error) {
                response.error();
            }
        });
	};
		
    /**
	* 解锁日期数据检查
	*
	*/
	var check_unlock_dates = function(mode) {
        var unlock_dates = request.params.unlock_dates;
	    var unlock_date_num = unlock_dates.length;

        if (typeof(unlock_dates) == "undefined") {
            response.success(ERROR_MSG.ERR_DATE_STYLE);
            return;
        }
        else {
            if (unlock_date_num === 0) {
                response.success(ERROR_MSG.ERR_LOCK_DATE_MUST_HAVE);
                return; 
            }
        }

		var unlock_date_params = [];	
        for (var i = 0 ; i < unlock_date_num ; i++) {
			unlock_date_params[i] = unlock_dates[i];
			unlock_date_params[i] = parseInt(unlock_date_params[i].split("-").join(""))
		}
		
        var unlock_dates_query = new AV.Query("kaka_worker_time");
		unlock_dates_query.containedIn("date", unlock_date_params);
		unlock_dates_query.equalTo("preorder", 1);

        unlock_dates_query.find({
            success : function(results) {
                if (results.length === 0) {
                    response.success(ERROR_MSG.ERR_TIME_NO_UNLOCK);
                    return;
                }

                if ("async" == mode) {
                    var promises = [];
                    promises.push(async_workertime_lock_promise(request.params.lock_dates));
                    promises.push(async_workertime_unlock_promise(request.params.unlock_dates));

                    return AV.Promise.when(promises).then(
                        function(v1, v2) {
                            if (v1 == RESULT_MSG.RET_OK &&
                                v2 == RESULT_MSG.RET_OK) {
                                    response.success(RESULT_MSG.RET_OK);
                            }
                            else {
                                /*if (v1 == RESULT_MSG.RET_OK) {
                                    response.success(v1);
                                }
                                if (v2 == RESULT_MSG.RET_OK) {
                                    response.success(v2);
                                }*/
                                response.success(ERROR_MSG.ERR_LOCK_UNLOC_NO_MATCHING);
                            }
                        }, 
                        function(error){
                            response.error(RESULT_MSG.RET_FAIL);
                        }
                    );
                }
                else if ("sync" == mode) {
                    sync_workertime_lock(request.params.lock_dates, false);
                }
            }, 
            error : function(error) {
			    response.error(error);
		    }
        });
	}
		
	// 参数验证
	if (!check_request_params_style(request, response)) {
        return;
    }

    var mode = request.params.mode;
    if (typeof(mode) == "undefined") {
        response.success(ERROR_MSG.ERR_MODE_STYLE);
        return;
    }
    else {
        if (request.params.mode.length === 0) {
            response.success(ERROR_MSG.ERR_MODE_MUST_HAVE);
            return; 
        }
    }

	check_lock_dates(mode);
});
