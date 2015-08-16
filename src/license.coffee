
processLicenseKey = (key, containerEl) ->
	if not key
		renderingWarningInContainer('Please use a valid license key. <a href="">More Info</a>', containerEl)


renderingWarningInContainer = (htmlMessage, containerEl) ->
	containerEl.append(
		$('<div class="fc-license-message" />').html(htmlMessage)
	)
