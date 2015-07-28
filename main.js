var ERROR_MSG = {
    'ERR_USER_MOBILE_MUST_HAVE':'{"state":"error", "code":0, "msg":"手机号不能为空"}', 
    'ERR_USER_PASSWORD_MUST_HAVE':'{"state":"error", "code":1, "msg":"密码不能为空"}', 
    'ERR_USER_EXITS':'{"state":"error", "code":2, "msg":"用户已存在"}', 
    'ERR_PREORDER_SLOW':'{"state":"error", "code":3, "msg":"当前日期某天已被预约，您来晚一步"}', 
    'ERR_DATE_LOCK_FAILED':'{"state":"error", "code":4, "msg":"日期锁定失败"}', 
    'ERR_DATE_UNLOCK_NOHAVE':'{"state":"error", "code":5, "msg":"日期解锁失败, 日期不存在"}', 
    'ERR_DATE_UNLOCK_FAILED':'{"state":"error", "code":6, "msg":"日期解锁失败, 日期已被解锁"}',
    'ERR_USERID_MUST_HAVE':'{"state":"error", "code":7, "msg":"用户ID必填"}', 
    'ERR_LOCK_DATE_NO_CONTINUE':'{"state":"error", "code":8, "msg":"加锁日期不连续"}', 
    'ERR_UNLOCK_DATE_NO_CONTINUE':'{"state":"error", "code":9, "msg":"解锁日期不连续"}', 
    'ERR_LOCK_DATE_MUST_HAVE':'{"state":"error", "code":10, "msg":"加锁日期必填"}', 
    'ERR_UNLOCK_DATE_MUST_HAVE':'{"state":"error", "code":11, "msg":"无解锁日期"}', 
    'ERR_TIME_NO_UNLOCK':'{"state":"error", "code":12, "msg":"所选时间段不能被解锁"}', 
    'ERR_TIME_NO_LOCK':'{"state":"error", "code":13, "msg":"所选时间段不能被锁定"}',
    'ERR_LOCK_UNLOC_NO_MATCHING':'{"state":"error", "code":14, "msg":"所选时间段锁定与解锁不匹配"}',
    'ERR_DATE_STYLE':'{"state":"error", "code":15, "msg":"时间样式错误"}',
    'ERR_UNLOCK_DATE_OVERDUE':'{"state":"error", "code":16, "msg":"解锁时间已过期"}',
    'ERR_MODE_STYLE':'{"state":"error", "code":17, "msg":"格式错误"}',
    'ERR_MODE_MUST_HAVE':'{"state":"error", "code":18, "msg":"时间请求模式,动作必须有"}',
    'ERR_COUNTERID_MUST_HAVE':'{"state":"error", "code":19, "msg":"counter ID必填"}', 
    'ERR_BELONGID_MUST_HAVE':'{"state":"error", "code":20, "msg":"belong ID必填"}',
    'ERR_BELONGTYPE_MUST_HAVE':'{"state":"error", "code":21, "msg":"belong type必填"}',
    'ERR_PID_MUST_HAVE':'{"state":"error", "code":22, "msg":"product ID必填"}', 
    'ERR_C2S_LOCK_DATE_NO_MATCHING':'{"state":"error", "code":23, "msg":"移动端和服务器锁定日期不匹配"}', 
    'ERR_C2S_UNLOCK_DATE_NO_MATCHING':'{"state":"error", "code":24, "msg":"移动端和服务器解锁日期不匹配"}', 
    'ERR_PREORDER_LOCK_DATE_NO_EXIST':'{"state":"error", "code":25, "msg":"此预订日期不存在"}',
    'ERR_HIDE_LOCK_DATE_NO_EXIST':'{"state":"error", "code":26, "msg":"屏蔽日期某一天不可屏蔽"}',
    'ERR_USER_NO_EXITS':'{"state":"error", "code":27, "msg":"用户不存在"}',
    'ERR_FILEID_MUST_HAVE':'{"state":"error", "code":28, "msg":"文件ID必填"}',
    'ERR_FILE_NAME_MUST_HAVE':'{"state":"error", "code":29, "msg":"文件名必填"}',
    'ERR_FILE_DATA_MUST_HAVE':'{"state":"error", "code":30, "msg":"文件数据必填"}',
    'ERR_FILE_TYPE_MUST_HAVE':'{"state":"error", "code":31, "msg":"文件类型必填"}'
}; 

var RESULT_MSG = {
    'RET_FAIL':'{"state":"failed", "code":0, "msg":"失败"}',
    'RET_OK':'{"state":"ok", "code":1, "msg":"成功"}'
};

var role_id = "555c2a42e4b0b7e69366bff2";

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
                else {
                    user_obj.set("username", username);
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
* brief   : 改变用户角色
* @param  : request -{"worker_role":"cameraman", "mobile":"136xxxxxxx"} 
*           response - RET_OK or ERROR
* @return : RET_OK - success
*           ERROR  - system error
*/
AV.Cloud.define('kaka_post_user_info', function(request, response) {
    var worker_role = request.params.worker_role;
    var mobile = request.params.mobile;
     
    if (typeof(mobile) == "undefined" || mobile.length === 0) {
        response.success(ERROR_MSG.ERR_USER_MOBILE_MUST_HAVE);
        return;
    }

    var role_collection = AV.Object.extend("_Role");
    var role_obj = new role_collection();
    if ("cameraman" === worker_role) {
        role_obj.id = role_id;
    }

    var user = AV.Object.extend("_User");
    var user_obj = new user();

    var query = new AV.Query(user);
    query.equalTo("mobilePhoneNumber", mobile);

    query.find({
        success :function(results) {
            if (typeof(results) == "undefined" || results.length === 0){
                response.success(ERROR_MSG.ERR_USER_NO_EXITS);
                return;
            }

            var user_obj = results[0];
            user_obj.set("role", role_obj);
            user_obj.save();
            
            response.success(RESULT_MSG.RET_OK);
        },
        error : function(user, error) {
            response.error(error);
        }
    });
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
            response.success(results);
         },
         error : function(error) {
             response.error(error);
         }
    });  
});

/**
* brief   : 获取摄影师集合
* @param  : request - {"pid":"555c2d55e4b0b7e69366d64a", "global":0, "type":"product","worker_role":"cameraman"}
*           response - return
* @return : results -query result array
*           ERROR  - system error or define error
*/
AV.Cloud.define('kaka_get_worker_cameraman', function(request, response) {
    var pid = request.params.pid;
    var type = request.params.type;
    var global = request.params.global;
    var worker_role = request.params.worker_role;
    var query;
 
    if (1 === global) {
        var role_collection = AV.Object.extend("_Role");
        var role_obj = new role_collection();
        query = new AV.Query("_User");

        if ("cameraman" === worker_role) {
            role_obj.id = role_id;
        }
        
        query.equalTo("role", role_obj);
        query.include('icon');
    }
    else if (0 === global) {
        if (typeof(pid) == "undefined" || pid.length === 0) {
            response.success(ERROR_MSG.ERR_PID_MUST_HAVE);
            return;
        }

        if ("product" === type) {
           query = new AV.Query("kaka_product");
           query.equalTo("objectId", pid);
           //worker_query = AV.Relation.reverseQuery('_User', 'worker', kaka_product_obj);
           //worker_query.include('icon');
        }
    }
    
    query.find ({
        success : function(results) {
            var result_num = results.length;
            if (1 === global) {
                for (var i = 0; i < result_num; i++) {
                    results[i].set("icon", JSON.stringify(results[i].get('icon')));
                }
               
                response.success(results);
            }
            else if (0 === global) { 
                var kaka_product_obj = results[0];
                var relation = kaka_product_obj.relation("worker");
                //relation.targetClassName = "_User";
                var worker_relation_query = relation.query();
                worker_relation_query.include('icon');

                worker_relation_query.find ({
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
            }
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
*           "mode":"sync","action":"lock"}
*           request - define error
* @return : true  - success
*           false - define error
*/
var check_request_params_style = function(request, response, action) {
    var params = request.params;
    var lock_date_num = params.lock_dates.length;
    var unlock_date_num = params.unlock_dates.length;
    // 用户ID必填
    if (typeof(params.user_id) == "undefined" || params.user_id.length === 0) {
        response.success(ERROR_MSG.ERR_USERID_MUST_HAVE);
        return -1;
    }
 
    if (typeof(params.lock_dates) != "undefined") {
        if ("lock" == action || "hide" == action) {
            if (lock_date_num === 0) {
                response.success(ERROR_MSG.ERR_LOCK_DATE_MUST_HAVE);
                return -1;
            }
        }
        
        if ("lock" == action) {
            if (!check_continuous_date(params.lock_dates)) {
                response.success(ERROR_MSG.ERR_LOCK_DATE_NO_CONTINUE);
                return -1;
            } 
        }
    }
    else {
        response.success(ERROR_MSG.ERR_DATE_STYLE);
        return -1;
    }

    // 解锁日期可选
    if (typeof(params.unlock_dates) != "undefined") { 
        if ("unlock" == action) {
            if (!check_continuous_date(params.unlock_dates)) {
                response.success(ERROR_MSG.ERR_UNLOCK_DATE_NO_CONTINUE);
                return -1;
            }
        }
 
        if ("unlock" == action || "unhide" == action) {
            if (unlock_date_num > 0) {
                return 1;
            }
        }
    }
    else {
        response.success(ERROR_MSG.ERR_DATE_STYLE);
        return -1;
    }

    return 0;
};

/**
* brief   : 发送订单短信
* @param  : request -{"user_id" : "555c28b8e4b0b7e69366b482"}
*           reponse - define error, result or system error
*           {"result":"{"state":"error", "code":20, "msg":"xxxx"}"}
* @return : success - RET_OK
*           error - define error or system error
*/
var send_trade_sms = function(user_id) { 
    if (typeof(user_id) == "undefined" || user_id.length === 0) {
        response.success(ERROR_MSG.ERR_USERID_MUST_HAVE);
        return;
    }

    var user = AV.Object.extend("_User");
    var query = new AV.Query(user);
    
    query.get(user_id, {
        success : function(user_obj) {
            mobile = user_obj.get("mobilePhoneNumber");
            AV.Cloud.requestSmsCode({
                mobilePhoneNumber:mobile,
                template:"worker_trade"
            }).then(function() {
            },function(error) {
            });
        },
        error : function(user_obj, error) {
        }
    });
};

/**
* brief   : 同步(异步)摄影师多个日期加解锁
* @param  : request - {"user_id" : "555c2822e4b0b7e69366b104","unlock_dates":
*           ["2015-06-01","2015-06-02"],"lock_dates":["2015-06-28","2015-06-29"],
*           "mode":"sync", "action":"lock"}
*           action : lock unlock hide unhide
*           response - define error, result or system error
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
 
    var async_workertime_unlock_promise = function(unLock_dates, action) {
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
                                    if ("unhide" == action) {
                                        worker_time[i].set("hide", false);
                                    }
                                }
                            }
                        }

                        if (-1 == state_code) {
                            resolve(ERROR_MSG.ERR_DATE_UNLOCK_NOHAVE);
                            return;
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

    var async_workertime_lock_promise = function(lock_dates, action) { 
        return new AV.Promise(function(resolve, reject) { 
            var async_workertime_lock = function(lock_dates, action) {
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
                lock_date_query.ascending("date");

                var worker_time = [];
                lock_date_query.find ({
                    success: function(results) {
                        var j = 0;
                        var date;
                        for (var i = 0; i < lock_date_num; i++) {
                            if (results.length === 0) {
                                worker_time[i] = new kaka_worker_time_collection();
                                worker_time[i].set("worker", user_obj);
                                worker_time[i].set("preorder", 1);
                                worker_time[i].set("date", lock_date_array[i]);
                                worker_time[i].set("year_month", parseInt(lock_date_array[i] / 100));
                                worker_time[i].set("days", lock_date_array[i] % 100);
                                worker_time[i].set("sure", 0);
                                if ("hide" == action) {
                                    worker_time[i].set("hide", true);
                                }
                            }
                            else {
                                if (j < results.length) {
                                    date = results[j].get('date');
                                }

                                if (date == lock_date_array[i]) {
                                    worker_time[i] = results[j];

                                    var preorder = worker_time[i].get('preorder');
                                    if (0 === preorder) {
                                        worker_time[i].increment("preorder"); 
                                        if ("hide" == action) {
                                            worker_time[i].set("hide", true);
                                        }
                                    }
                                    else if (1 == preorder){
                                        state_code = -1;
                                    }
                                    else if(1 < preorder) {
                                        //workerTime.fetchWhenSave(true);
                                        worker_time[i].increment("preorder", -1);
                                        state_code = -2;
                                    }

                                    j++;
                                }
                                else if (date != lock_date_array[i]) {
                                    worker_time[i] = new kaka_worker_time_collection();
                                    worker_time[i].set("worker", user_obj);
                                    worker_time[i].set("preorder", 1);
                                    worker_time[i].set("date", lock_date_array[i]);
                                    worker_time[i].set("year_month", parseInt(lock_date_array[i] / 100));
                                    worker_time[i].set("days", lock_date_array[i] % 100);
                                    worker_time[i].set("sure", 0);
                                    if ("hide" == action) {
                                        worker_time[i].set("hide", true);
                                    }
                                }
                            }
                        }

                        if (0 < state_code) {
                            resolve(ERROR_MSG.ERR_PREORDER_SLOW);
                            return;
                        }

                        // 添加一天加锁的预约时间
                        AV.Object.saveAll(worker_time, { 
                            success : function(work_time) {
                                resolve(RESULT_MSG.RET_OK);
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

    var sync_workertime_lock = function(lock_dates, single, action) {
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
        lock_date_query.ascending('date');

        var worker_time = [];
        lock_date_query.find ({
            success: function(results) {
                var j = 0;
                var date;
                for (var i = 0; i < lock_date_num; i++) {
                    if (results.length === 0) {
                        worker_time[i] = new kaka_worker_time_collection();
                        worker_time[i].set("worker", user_obj);
                        worker_time[i].set("preorder", 1);
                        worker_time[i].set("date", lock_date_array[i]);
                        worker_time[i].set("year_month", parseInt(lock_date_array[i] / 100));
                        worker_time[i].set("days", lock_date_array[i] % 100);
                        worker_time[i].set("sure", 0);
                        if ("hide" == action) {
                            worker_time[i].set("hide", true);
                        }
                    }
                    else {
                        if (j < results.length) {
                            date = results[j].get('date');
                        }

                        if (date == lock_date_array[i]) {
                            worker_time[i] = results[j];
                            
                            var preorder = worker_time[i].get('preorder');
                            if (0 === preorder) {
                                worker_time[i].increment("preorder"); 
                                if ("hide" == action) {
                                    worker_time[i].set("hide", true);
                                }
                            }
                            else if (1 == preorder){
                                state_code = -1;
                            }
                            else if(1 < preorder) {
                                //workerTime.fetchWhenSave(true);
                                worker_time[i].increment("preorder", -1);
                                state_code = -2;
                            }

                            j++;
                        }
                        else if (date != lock_date_array[i]) {
                            worker_time[i] = new kaka_worker_time_collection();
                            worker_time[i].set("worker", user_obj);
                            worker_time[i].set("preorder", 1);
                            worker_time[i].set("date", lock_date_array[i]);
                            worker_time[i].set("year_month", parseInt(lock_date_array[i] / 100));
                            worker_time[i].set("days", lock_date_array[i] % 100);
                            worker_time[i].set("sure", 0);
                            if ("hide" == action) {
                                worker_time[i].set("hide", true);
                            }
                        }
                    }
                }
                
                if (0 < state_code) {
                    response.success(ERROR_MSG.ERR_PREORDER_SLOW);
                    return;
                }

                // 添加一天加锁的预约时间
                AV.Object.saveAll(worker_time, { 
                    success : function(work_time) {
                        if (single) {
                            response.success(RESULT_MSG.RET_OK);
                        }
                        else {
                            if ("lock" == action) {
                                sync_workertime_unlock(request.params.unlock_dates, action);
                            }
                        }
                    }, 
                    error : function(work_time, error) {
                        response.error(error);
                    }
                });     
            }, 
            error : function(error) {
                response.error(error);
            }
        });
    };
    
    var sync_workertime_unlock = function(unlock_dates, action) {
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

        for(var i = 0 ; i < unlock_date_num ; i++) {
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
                if (results.length != unlock_date_num) {
                    response.success(ERROR_MSG.ERR_C2S_UNLOCK_DATE_NO_MATCHING);
                    return;
                }

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
                            if ("unhide" == action) {
                                worker_time[i].set("hide", false);
                            }
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
    var check_lock_dates = function(mode, action) {
        var lock_dates = request.params.lock_dates;
        var lock_date_len = lock_dates.length;
        var lock_date_params = [];

        var unlock_dates = request.params.unlock_dates;
        var unlock_date_len = unlock_dates.length;

        for(var i = 0 ; i < lock_date_len ; i++){
            lock_date_params[i] = lock_dates[i];
            lock_date_params[i] = parseInt(lock_date_params[i].split("-").join(""));
        }

        var user_collection = AV.Object.extend("_User");
        var user_obj = new user_collection();
        user_obj.id = request.params.user_id;

        var lock_date_query = new AV.Query("kaka_worker_time");
        lock_date_query.equalTo("worker", user_obj);
        lock_date_query.containedIn("date" , lock_date_params);
    
        lock_date_query.find({
            success : function(results) {
                if (results.length === 0) {
                    if (0 === unlock_date_len) {
                        if ("lock" == action || "hide" == action) {
                            sync_workertime_lock(lock_dates, true, action);
                        }
                        else {
                            response.success(ERROR_MSG.ERR_MODE_STYLE);
                            return;
                        }
                    }
                    else if (0 < unlock_date_len) {
                        if ("lock" == action) {
                            check_unlock_dates(mode, action);
                        }
                    }
                }
                else {
                    var results_num = results.length;
                    for (var i = 0; i < results_num ; i++) {
                        if (results[i].get('preorder') != 0) {
                            response.success(ERROR_MSG.ERR_TIME_NO_LOCK);
                            return;
                        }
                    }
                    if (0 === unlock_date_len) {
                        if ("lock" == action || "hide" == action) {
                            sync_workertime_lock(lock_dates, true, action);
                        }
                        else {
                            response.success(ERROR_MSG.ERR_MODE_STYLE);
                            return;
                        }
                    }
                    else if (0 < unlock_date_len) {
                        if ("lock" == action) {
                            check_unlock_dates(mode, action);
                        }
                    }
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
    var check_unlock_dates = function(mode, action) {
        var unlock_dates = request.params.unlock_dates;
        var unlock_date_num = unlock_dates.length;

        if (typeof(unlock_dates) == "undefined") {
            response.success(ERROR_MSG.ERR_DATE_STYLE);
            return;
        }
        else {
            if (unlock_date_num === 0) {
                response.success(ERROR_MSG.ERR_UNLOCK_DATE_MUST_HAVE);
                return; 
            }
        }

        var unlock_date_params = [];    
        for (var i = 0 ; i < unlock_date_num ; i++) {
            unlock_date_params[i] = unlock_dates[i];
            unlock_date_params[i] = parseInt(unlock_date_params[i].split("-").join(""))
        }
        
        var user_collection = AV.Object.extend("_User");
        var user_obj = new user_collection();
        user_obj.id = request.params.user_id;

        var unlock_dates_query = new AV.Query("kaka_worker_time");
        unlock_dates_query.equalTo("worker", user_obj);
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
                    promises.push(async_workertime_lock_promise(request.params.lock_dates, action));
                    promises.push(async_workertime_unlock_promise(request.params.unlock_dates, action));

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
                    if ("lock" == action) {
                        sync_workertime_lock(request.params.lock_dates, false, action);
                    }
                    else {
                        response.success(ERROR_MSG.ERR_MODE_STYLE);
                        return;
                    }
                }
            }, 
            error : function(error) {
                response.error(error);
            }
        });
    }
        
    // 参数验证
    var action = request.params.action;
    if (typeof(action) == "undefined") {
        response.success(ERROR_MSG.ERR_MODE_STYLE);
        return;
    }
    else {
        if (action.length === 0) {
            response.success(ERROR_MSG.ERR_MODE_MUST_HAVE);
            return; 
        }
    }
    
    var mode = request.params.mode;
    if (typeof(mode) == "undefined") {
        response.success(ERROR_MSG.ERR_MODE_STYLE);
        return;
    }
    else {
        if (mode.length === 0) {
            response.success(ERROR_MSG.ERR_MODE_MUST_HAVE);
            return; 
        }
    }

    var ret = check_request_params_style(request, response, action);
    if (ret < 0) {
        return;
    }
    else if (0 === ret) { 
        check_lock_dates(mode, action);
    }
    else if (1 === ret) {
        sync_workertime_unlock(request.params.unlock_dates, action);
    }
});

/**
* brief   : 预约日期确定
* @param  : request -{"user_id" : "555c28b8e4b0b7e69366b482" , "unlock_dates" : [], "lock_dates" : ["2015-07-22","2015-07-23"], "mode":"sync", "action":"lock"}
*           reponse - define error, result or system error
*           {"result":"{"state":"error", "code":20, "msg":"belong type必填}"}
* @return : success - RET_OK
*           error - define error or system error
*/
AV.Cloud.define('kaka_preorder_time_sure', function(request , response) {
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

        var user_collection = AV.Object.extend("_User");
        var user_obj = new user_collection();
        user_obj.id = request.params.user_id;
        
        var lock_date_query = new AV.Query("kaka_worker_time");
        lock_date_query.containedIn("date" , lock_date_params);
        lock_date_query.equalTo("preorder", 1);
        lock_date_query.equalTo("worker", user_obj);
     
        var worker_time = [];
        lock_date_query.find({
            success : function(results) {
                if (results.length === 0) {
                    response.success(ERROR_MSG.ERR_PREORDER_LOCK_DATE_NO_EXIST);
                }
                else {
                    var results_num = results.length;
                    if (results_num != lock_date_len) {
                        response.success(ERROR_MSG.ERR_C2S_LOCK_DATE_NO_MATCHING);
                        return;
                    }

                    for (var i = 0; i < results_num ; i++) {
                        worker_time[i] = results[i];
                        worker_time[i].set("sure", 1); 
                        worker_time[i].save();
                    }
                        
                    send_trade_sms(user_obj.id);

                    response.success(RESULT_MSG.RET_OK);
                }
            },
            error : function(error) {
                response.error();
            }
        });
    }

    // 参数验证
    var action = request.params.action
    if (typeof(action) == "undefined") {
        response.success(ERROR_MSG.ERR_MODE_STYLE);
        return;
    }
    else {
        if (action.length === 0) {
            response.success(ERROR_MSG.ERR_MODE_MUST_HAVE);
            return; 
        }
    }

    if (check_request_params_style(request, response, action) < 0) {
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

/**
* brief   : 发送订单短信
* @param  : request -{"user_id" : "555c28b8e4b0b7e69366b482"}
*           reponse - define error, result or system error
*           {"result":"{"state":"error", "code":20, "msg":"xxxx"}"}
* @return : success - RET_OK
*           error - define error or system error
*/
AV.Cloud.define('kaka_send_trade_sms', function(request , response) {
    var params = request.params;
    var user_id = params.user_id;
    
    if (typeof(user_id) == "undefined" || user_id.length === 0) {
        response.success(ERROR_MSG.ERR_USERID_MUST_HAVE);
        return;
    }

    var user = AV.Object.extend("_User");
    var query = new AV.Query(user);
    
    query.get(user_id, {
        success : function(user_obj) {
            mobile = user_obj.get("mobilePhoneNumber");
            AV.Cloud.requestSmsCode({
                mobilePhoneNumber:mobile,
                template:"worker_trade"
            }).then(function() {
                response.success(RESULT_MSG.RET_OK);
            },function(error) {
                response.success(error);
            });
        },
        error : function(user_obj, error) {
            response.success(error);
        }
    });
});
 
/**
* brief   : 添加评论,更新计数器
* @param  : request - 
*           comment:{"counter_id" : "558e6feae4b035e183fc1975", "user_id" : "555c2822e4b0b7e69366b104", "comment" : "test comment", "belong_id" : "555c2d55e4b0b7e69366d64a", "belong_type" : "product"} 
*           zan:{"counter_id" : "558e6feae4b035e183fc1975", "zan":"1"} 
*           favorite:{"counter_id" : "558e6feae4b035e183fc1975", "user_id" : "555c2822e4b0b7e69366b104", "favorite" : "1", "belong_id" : "555c2d55e4b0b7e69366d64a", "belong_type" : "product"}
*           reponse - define error, result or system error
*           {"result":"{"state":"error", "code":20, "msg":"belong type必填}"}
* @return : success - RET_OK
*           error - define error or system error
*/ 
AV.Cloud.define('kaka_uphold_counter_and_comment', function(request , response) {
    var params = request.params;
    var comment = params.comment;
    var favorite = params.favorite;
    var zan = params.zan;
    var share = params.share;
    var counter_id = params.counter_id;
    var user_id = params.user_id;
    var belong_id = params.belong_id;
    var belong_type = params.belong_type;
    var grade = params.grade;
    
    if (typeof(counter_id) == "undefined" || counter_id.length === 0) {
        response.success(ERROR_MSG.ERR_COUNTERID_MUST_HAVE);
        return;
    }

    var kaka_counter = AV.Object.extend("kaka_counter");
    var query = new AV.Query(kaka_counter);
      
    if (typeof(comment) != "undefined" && comment.length > 0) {
        if (typeof(user_id) == "undefined" || user_id.length === 0) {
            response.success(ERROR_MSG.ERR_USERID_MUST_HAVE);
            return;
        }
        
        if (typeof(belong_id) == "undefined" || belong_id.length === 0) {
            response.success(ERROR_MSG.ERR_BELONGERID_MUST_HAVE);
            return;
        }
        
        if (typeof(belong_type) == "undefined" || belong_type.length === 0) {
            response.success(ERROR_MSG.ERR_BELONGERTYPE_MUST_HAVE);
            return;
        }

        var kaka_comment = AV.Object.extend("kaka_comment");
        var kaka_comment_obj = new kaka_comment();
        var kaka_user = AV.Object.extend("_User");
        var kaka_user_obj = new kaka_user();
        kaka_user_obj.id = user_id;
        kaka_comment_obj.set("belong_user", kaka_user_obj);
        kaka_comment_obj.set("text", comment);

        if ("worker" == belong_type) {
            kaka_user_obj.id = belong_id;
            kaka_comment_obj.set("belong_worker", kaka_user_obj);
        }
        else if ("product" == belong_type) {
            var kaka_product = AV.Object.extend("kaka_product");
            var kaka_product_obj = new kaka_product();
            kaka_product_obj.id = belong_id;
            kaka_comment_obj.set("belong_product", kaka_product_obj);
        }
        else if ("trade" == belong_type) {
            var kaka_trade = AV.Object.extend("kaka_trade");
            var kaka_trade_obj = new kaka_trade();
            kaka_trade_obj.id = belong_id;
            kaka_comment_obj.set("belong_trade", kaka_trade_obj);
        }
        kaka_comment_obj.save();

        query.get(counter_id, {
            success : function (kaka_counter) {
                kaka_counter.increment("comment");
                kaka_counter.save();
                response.success(RESULT_MSG.RET_OK);
            },
            error : function(kaka_counter, error) {
                response.error(error);
            }
        });
    }
    
    if (typeof(favorite) != "undefined" && favorite.length > 0) {
        var kaka_favorite = AV.Object.extend("kaka_favorite");
        var kaka_favorite_obj = new kaka_favorite();
        var kaka_user = AV.Object.extend("_User");
        var kaka_user_obj = new kaka_user();
        kaka_user_obj.id = user_id;
        kaka_favorite_obj.set("user", kaka_user_obj);

        if ("product" == belong_type) {
            var kaka_product = AV.Object.extend("kaka_product");
            var kaka_product_obj = new kaka_product();
            kaka_product_obj.id = belong_id;
            kaka_favorite_obj.set("product", kaka_product_obj);
        }
        kaka_favorite_obj.save();

        query.get(counter_id, {
            success : function (kaka_counter) {
                kaka_counter.increment("favorite");
                kaka_counter.save();
                response.success(RESULT_MSG.RET_OK);
            },
            error : function(kaka_counter, error) {
                response.error(error);
            }
        });
    }
    
    if (typeof(zan) != "undefined" && zan.length > 0) {
        query.get(counter_id, {
            success : function (kaka_counter) {
                kaka_counter.increment("zan");
                kaka_counter.save();
                response.success(RESULT_MSG.RET_OK);
            },
            error : function(kaka_counter, error) {
                response.error(error);
            }
        });
    }
    
    if (typeof(share) != "undefined" && share.length > 0) {
        query.get(counter_id, {
            success : function (kaka_counter) {
                kaka_counter.increment("share");
                kaka_counter.save();
                response.success(RESULT_MSG.RET_OK);
            },
            error : function(kaka_counter, error) {
                response.error(error);
            }
        });
    }        
});

/**
* brief   : 上传图片(头像)
* @param  : request -{"user_id" : "555c28b8e4b0b7e69366b482" , "file_name":"xxxxx", "file_base64":"xxxxx", "type":2}
*           reponse - define error, result or system error
*           {"result":"{"state":"error", "code":20, "msg":"belong type必填}"}
* @return : success - RET_OK
*           error - define error or system error
*/
AV.Cloud.define('kaka_upload_file', function(request, response) {
    var user_id = request.params.user_id;
    var file_name = request.params.file_name;
    var file_base64 = request.params.file_base64;
    var type = request.params.type;

    if (typeof(user_id) == "undefined" || user_id.length === 0) {
        response.success(ERROR_MSG.ERR_USERID_MUST_HAVE);
        return;
    }

    if (typeof(file_name) == "undefined" || file_name.length === 0) {
        response.success(ERROR_MSG.ERR_FILE_NAME_MUST_HAVE);
        return;
    }

    if (typeof(file_base64) == "undefined" || file_base64.length === 0) {
        response.success(ERROR_MSG.ERR_FILE_DATA_MUST_HAVE);
        return;
    }

    if (typeof(type) == "undefined" || type.length === 0) {
        response.success(ERROR_MSG.ERR_FILE_TYPE_MUST_HAVE);
        return;
    }
    
    var file_obj = new AV.File(file_name, { base64: file_base64 });
    file_obj.metaData().mimeType = "image/jpeg";
    file_obj.save().then(function(file_obj) {
            var user = AV.Object.extend("_User");
            var user_obj = new user();
            user_obj.id = user_id;

            var kaka_picture = AV.Object.extend("kaka_picture");
            var kaka_picture_obj = new kaka_picture();
            kaka_picture_obj.set("belong_user", user_obj);
            kaka_picture_obj.set("picture", file_obj);
            kaka_picture_obj.set("picture_type", type);
            kaka_picture_obj.save(null, {
                success : function(kaka_picture_obj) {
                    console.log("kaka picture:", kaka_picture_obj.id);
                    if (2 == type) {
                        var query = new AV.Query(user);
                        query.get(user_id, {
                            success : function (user_obj) {
                                user_obj.set("icon", kaka_picture_obj);
                                user_obj.save();

                                response.success(RESULT_MSG.RET_OK);
                            },
                            error : function (user_obj, error) {
                                response.error(error);
                            }
                        });
                    }
                },
                error : function(kaka_picture_obj, error) {
                    response.error(error);
                }
            });
        },
        function(file_obj, error) {
            response.error(error);
        }
    );    
});
 
