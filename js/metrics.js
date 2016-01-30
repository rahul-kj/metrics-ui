var endpoint = 'http://metrics.apps.homelab.io';
var timeOutInterval = 30000;
var metricsModule = angular
		.module('metricsApp', ["chart.js"])
		.directive(
				'loading',
				function() {
					return {
						restrict : 'E',
						replace : true,
						template : '<div class="loading"><img src="./images/ajax-loader.gif" width="20" height="20" align="center"/>Please wait while the data is being pulled</div>',
						link : function(scope, element, attr) {
							scope.$watch('loading', function(val) {
								if (val)
									$(element).show();
								else
									$(element).hide();
							});
						}
					}
				})
		.directive(
				'collapseToggler',
				function() {
					return {
						restrict : 'A',
						link : function(scope, element, attr) {
							element
									.on(
											'click',
											function() {
												$(this).siblings('.collapse')
														.toggleClass('in');
												if ($(this)
														.find('.glyphicon')
														.hasClass(
																"glyphicon-chevron-down")) {
													$(this)
															.find('.glyphicon')
															.removeClass(
																	"glyphicon-chevron-down")
															.addClass(
																	"glyphicon-chevron-up");
												} else {
													$(this)
															.find('.glyphicon')
															.removeClass(
																	"glyphicon-chevron-up")
															.addClass(
																	"glyphicon-chevron-down");
												}
											});
						}
					};
				})
		.controller(
				'metricsCtrl',
				function($scope, $timeout, $http) {
					$scope.dataToLoad = 5;

					$scope.turnOffLoading = function() {
						if($scope.dataToLoad === 0) {
							$scope.loading = false;
						}
					}
					
					$scope.populateCharts = function() {
						$scope.deploymentChartMap = [];
						uniqueDeploymentNames = [];

						var chartLabels = [];
						var chartData = [];
						_.each($scope.vmMetrics, function(vmMetric) {
							if(!_.contains(uniqueDeploymentNames, vmMetric.jobDetail.deployment)) {
								uniqueDeploymentNames.push(vmMetric.jobDetail.deployment);
							}
						});
						
						_.each(uniqueDeploymentNames, function(uniqueDeploymentName) {
							chartMeta = {};
							chartMeta["healthydata"] = [];
							chartMeta["healthylabels"] = [];
							chartMeta["unhealthydata"] = [];
							chartMeta["unhealthylabels"] = [];
							_.each($scope.vmMetrics, function(vmMetric) {
								if(vmMetric.jobDetail.deployment == uniqueDeploymentName) {
									if(vmMetric.fixedAttribute.system_healthy == "1.0") {
										chartMeta.healthylabels.push(vmMetric.jobDetail.job);
										if(vmMetric.fixedAttribute.system_cpu_user == "0.0") {
											chartMeta.healthydata.push("0.1");
										} else {
											chartMeta.healthydata.push(vmMetric.fixedAttribute.system_cpu_user);
										}
									} else {
										chartMeta.unhealthylabels.push(vmMetric.jobDetail.job);
										chartMeta.unhealthydata.push(vmMetric.fixedAttribute.system_mem_percent);
									}
								}
							});
							
							$scope.deploymentChartMap.push({
								deploymentname : uniqueDeploymentName,
								chartMeta : chartMeta
							});
						});
						
						console.log($scope.deploymentChartMap);
					}

					$scope.total_app_instances = function() {
						var total_ai_count = 0;
						_.each($scope.spaces, function(space) {
							if (space.organization.name != "system" && space.organization.name != "p-spring-cloud-services") {
								total_ai_count += space.number_of_app_instances;
							}
						});

						$scope.total_ai_count = total_ai_count;
					}

					$scope.app_instances_per_space = function() {
						_.each($scope.spaces, function(space) {
							var i = 0;
							var j = 0;
							_.each($scope.apps, function(app) {
								if(app.space_name === space.name && app.org_name === space.organization.name) {
									i++;
									j += app.instances;
								}
							})
							space.number_of_apps = i;
							space.number_of_app_instances = j;
						});
					}

					$scope.totals = function() {
						_.each($scope.customJobMetrics, function(customJobMetric) {
							if(customJobMetric.jobDetail.job === "CloudController" && customJobMetric.jobDetail.deployment === "untitled_dev") {
								$scope.total_user_count = _.find(customJobMetric.customAttributes, function(attribute) {
									if(attribute.name === "total_users") {
										return attribute.value;
									}
								})
							}

							if(customJobMetric.jobDetail.job === "Router" && customJobMetric.jobDetail.deployment === "untitled_dev") {
								$scope.total_routes = _.find(customJobMetric.customAttributes, function(attribute) {
									if(attribute.name === "router.total_routes") {
										return attribute.value;
									}
								})
							}
						});
					}

					var totals = function() {
						$http.get(endpoint + '/totals').success(
							function(data) {
								$scope.total = data;
								$scope.dataToLoad--;
								$scope.turnOffLoading();
							}).error(
							function(msg, response) {
								console.log(msg, response);
								$('.alert-danger').html(
										"Error while invoking the server")
										.show();
							});
					}

					var metrics = function() {
						$http
							.get(endpoint + '/metrics')
							.success(
									function(data) {
										$scope.vmMetrics = data.vmMetrics;
										$scope.customJobMetrics = data.customJobMetrics;
										$scope.totals();
										$scope.dataToLoad--;
										$scope.turnOffLoading();
										$scope.populateCharts();
									})
							.error(
									function(response) {
										$scope.loading = false;
										$('.alert-danger')
												.html(
														"Error while invoking the server")
												.show();
										console.log(response);
									});
					}

					var orgs = function() {
						$http.get(endpoint + '/orgs').success(
							function(data) {
								$scope.orgs = data;
								$scope.dataToLoad--;
								$scope.turnOffLoading();
							}).error(
							function(response) {
								console.log(response);
								$('.alert-danger').html(
										"Error while invoking the server")
										.show();
							});
					}

					var spaces = function() {
						$http.get(endpoint + '/spaces').success(
							function(data) {
								$scope.spaces = data;
								$scope.dataToLoad--;
								$scope.turnOffLoading();
							}).error(
							function(response) {
								console.log(response);
								$('.alert-danger').html(
										"Error while invoking the server")
										.show();
							});
					}

					var apps = function() {
						$http.get(endpoint + '/apps').success(
							function(data) {
								$scope.apps = data;

								_.each($scope.apps, function(app) {
									_.find($scope.spaces, function(space) {
										if(app.space.meta.guid === space.meta.guid) {
											app.space_name = space.name;
											app.org_name = space.organization.name;
										}
									})
								});

								$scope.app_instances_per_space();
								$scope.total_app_instances();

								$scope.dataToLoad--;
								$scope.turnOffLoading();
							}).error(
							function(response) {
								console.log(response);
								$('.alert-danger').html(
										"Error while invoking the server")
										.show();
							});
					}
					
					var execute = function() {
						$scope.loading = true;
						$('.alert-danger').hide();
						totals();
						metrics();
						orgs();
						spaces();
//						apps();
					}
					
					execute();
//					$timeout(execute, timeOutInterval);
					
					

				});
				
