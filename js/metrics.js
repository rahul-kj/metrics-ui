var metricsModule = angular
		.module('metricsApp', [])
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
				function($scope, $http) {
					var endpoint = 'http://metrics.apps.homelab.io';
					$scope.loading = true;
					$scope.dataToLoad = 5;
					
					$scope.turnOffLoading = function() {
						if($scope.dataToLoad === 0) { 
							$scope.loading = false;
						}
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
					
					$http.get(endpoint + '/totals').success(
							function(data) {
								$scope.totals = data;
								$scope.dataToLoad--;
								$scope.turnOffLoading();
							}).error(
							function(msg, response) {
								console.log(msg, response);
								$('.alert-danger').html(
										"Error while invoking the server")
										.show();
							});

					$http
							.get(endpoint + '/metrics')
							.success(
									function(data) {
										$scope.vmMetrics = data.vmMetrics;
										$scope.customJobMetrics = data.customJobMetrics;
										$scope.totals();
										$scope.dataToLoad--;
										$scope.turnOffLoading();
									})
							.error(
									function(response) {
										$scope.loading = false;
										$('.alert-danger')
												.html(
														"Error while invoking the server")
												.show();
									});

					$http.get(endpoint + '/orgs').success(
							function(data) {
								$scope.orgs = data;
								$scope.dataToLoad--;
								$scope.turnOffLoading();
							}).error(
							function(response) {
								$('.alert-danger').html(
										"Error while invoking the server")
										.show();
							});
					
					$http.get(endpoint + '/spaces').success(
							function(data) {
								$scope.spaces = data;
								$scope.dataToLoad--;
								$scope.turnOffLoading();
							}).error(
							function(response) {
								$('.alert-danger').html(
										"Error while invoking the server")
										.show();
							});
					
					
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
					
				});
