
RELEASE_DATE = '<%= releaseDate %>' # for Scheduler
UPGRADE_WINDOW = { years: 1, weeks: 1 } # 1 week leeway, for tz shift reasons too
LICENSE_INFO_URL = 'http://fullcalendar.io/scheduler/license/'
PRESET_LICENSE_KEYS = [
	'GPL-My-Project-Is-Open-Source'
	'CC-Attribution-NonCommercial-NoDerivatives'
]


processLicenseKey = (key, containerEl) ->
	if not isImmuneUrl(window.location.href) and not isValidKey(key)
		if not detectWarningInContainer(containerEl)
			renderingWarningInContainer(
				'Please use a valid license key. <a href="' + LICENSE_INFO_URL + '">More Info</a>',
				containerEl
			)

###
This decryption is not meant to be bulletproof. Just a way to remind about an upgrade.
###
isValidKey = (key) ->
	if $.inArray(key, PRESET_LICENSE_KEYS) != -1
		return true
	parts = (key or '').match(/^(\d+)\-fcs\-(\d+)$/)
	if parts and parts[1].length == 10
		purchaseDate = moment.utc(parseInt(parts[2]) * 1000)
		releaseDate = moment.utc(FC.mockSchedulerReleaseDate or RELEASE_DATE)
		if releaseDate.isValid() # token won't be replaced in dev mode
			minPurchaseDate = releaseDate.clone().subtract(UPGRADE_WINDOW)
			if purchaseDate.isAfter(minPurchaseDate)
				return true
	false


isImmuneUrl = (url) ->
	Boolean(url.match(/\w+\:\/\/fullcalendar\.io\/|\/demos\/[\w-]+\.html$/))


renderingWarningInContainer = (messageHtml, containerEl) ->
	containerEl.append(
		$('<div class="fc-license-message" />').html(messageHtml)
	)


# returns boolean of whether a license message is already rendered
detectWarningInContainer = (containerEl) ->
	containerEl.find('.fc-license-message').length >= 1
