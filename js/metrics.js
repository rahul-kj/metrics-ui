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

					$http
							.get(endpoint + '/metrics')
							.success(
									function(data) {
										$scope.vmMetrics = data.vmMetrics;
										$scope.customJobMetrics = data.customJobMetrics;

										$scope.healthyComponents = getHealthyComponents($scope.vmMetrics);
										$scope.loading = false;
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
							}).error(
							function(response) {
								$('.alert-danger').html(
										"Error while invoking the server")
										.show();
							});
					
					$http.get(endpoint + '/spaces').success(
							function(data) {
								$scope.spaces = data;
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
								
								_.each($scope.spaces, function(space) {
									var i = 0;
									var j = 0;
									_.each($scope.apps, function(app) {
										if(app.space_name === space.name) {
											i++;
											j += app.instances;
										}
									})
									space.number_of_apps = i;
									space.number_of_app_instances = j;
								});
								
								var total_ai_count = 0;
								_.each($scope.spaces, function(space) {
									if (space.organization.name != "system" && space.organization.name != "p-spring-cloud-services") {
										total_ai_count += space.number_of_app_instances;
									}
								});
								
								$scope.total_ai_count = total_ai_count;
								
							}).error(
							function(response) {
								$('.alert-danger').html(
										"Error while invoking the server")
										.show();
							});
					
				});

function getHealthyComponents(vmMetrics) {
	var systemHealthComponents = _.filter(vmMetrics, function(vmMetric) {
		return (vmMetric.fixedAttribute.system_healthy === "1.0");
	});
	return (systemHealthComponents);

};