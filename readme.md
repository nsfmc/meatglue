# Meatglue

Meatglue is a jQuery+Backbone+jQueryUI library which simplifies the process of creating reactive bindings on your webpages.

Modeled off bret victor's tangle and tanglekit (whose reactive modules are firmly on the side of mochikit), meatglue is designed to be used in a similar fashion, but on sites where backbone and jquery ui are already present. Meatglue is not tangle, though. A better way of thinking about it is a collection of related views which can be rapidly dropped into a page. 

It is compatible with IE >= 8 and modern versions of chrome, safari, opera and firefox.

## Using

Right now, meatglue is somewhat heavyweight in terms of dependencies:

* jQuery ~= 1.7.1
* backbone ~= 0.9.0
* underscore ~= 1.3.1
* jQueryUI => 1.8.16 (core, mouse, widget, draggable, droppable)
* jQuery Mobile vmouse (this is optimistic, it's not currently hooked in, but making things touch friendly is an admirable goal)

wowza, that's a lot of deps! Unless, of course, you already use them in your app, in which case, meatglue is remarkably cheap!
