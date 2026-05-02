
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    // Adapted from https://github.com/then/is-promise/blob/master/index.js
    // Distributed under MIT License https://github.com/then/is-promise/blob/master/LICENSE
    function is_promise(value) {
        return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, '');
        }
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_iframe_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
                // make sure an initial resize event is fired _after_ the iframe is loaded (which is asynchronous)
                // see https://github.com/sveltejs/svelte/issues/4233
                fn();
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Tailwindcss.svelte generated by Svelte v3.59.2 */

    function create_fragment$a(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Tailwindcss', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tailwindcss> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Tailwindcss extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tailwindcss",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/components/Logo.svelte generated by Svelte v3.59.2 */

    const file$8 = "src/components/Logo.svelte";

    function create_fragment$9(ctx) {
    	let svg;
    	let g2;
    	let g1;
    	let g0;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g2 = svg_element("g");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M165.877,215.476c-1.715-3.751-10.725-24.116-17.08-51.345c-6.563-28.114-11.37-69.195,2.995-105.232\n          c3.438-8.623,7.773-16.553,12.974-23.783c-17.712,0.269-34.225,5.158-49.334,14.661c-29.668,18.659-48.357,51.999-58.813,76.685\n          c-10.854,25.63-15.224,46.934-15.666,49.166c-5.229,19.961-4.464,38.505,2.272,55.117c6.085,15.012,16.906,28.153,32.168,39.08\n          c8.746,18.914,13.293,32.731,13.355,35.884L60.574,412.68c-1.695,6.439,2.164,13.06,8.604,14.754l46.191,12.166\n          c6.439,1.697,13.06-2.161,14.756-8.604l28.142-106.85c0.73-1.082,4.271-5.674,17.7-16.109c4.32-3.358,8.559-6.459,11.632-8.659\n          c18.666-1.991,34.556-8.101,47.247-18.167c1.316-1.043,2.583-2.143,3.826-3.268c-11.978-2.325-22.965-6.556-32.827-12.679\n          C188.021,254.198,174.576,237.448,165.877,215.476z\n          M135.092,317.296l-25.249,95.87l-22.834-6.016l25.251-95.867\n          c1.071-4.069,1.259-9.916-3.572-23.945c6.462,2.469,13.28,4.655,20.37,6.521c7.063,1.86,14.045,3.313,20.859,4.347\n          C138.894,307.966,136.176,313.178,135.092,317.296z");
    			add_location(path0, file$8, 9, 8, 196);
    			attr_dev(path1, "d", "M401.643,363.635l-40.205-102.921c-0.049-1.302,0.109-7.101,4.812-23.444c1.514-5.259,3.112-10.259,4.299-13.849\n          c13.912-12.604,23.151-26.902,27.476-42.511c4.789-17.276,3.421-35.783-4.062-55.013c-0.692-2.168-7.478-22.83-21.199-47.046\n          c-13.217-23.324-35.604-54.304-67.212-69.439c-25.263-12.097-52.65-12.535-81.399-1.304\n          c-28.75,11.231-48.587,30.115-58.96,56.134c-12.979,32.553-8.442,70.506-2.349,96.611c6.327,27.106,15.346,46.895,16.306,48.958\n          c7.531,19.21,19.074,33.745,34.304,43.2c13.763,8.545,30.247,12.791,49.02,12.63c18.209,10.131,30.021,18.617,31.929,21.129\n          l40.25,103.034c2.424,6.204,9.442,9.279,15.646,6.858l44.49-17.383C400.991,376.855,404.066,369.839,401.643,363.635z\n          M287.734,134.428c-12.215,0-22.116-9.903-22.116-22.116c0-12.215,9.901-22.115,22.116-22.115c12.213,0,22.115,9.9,22.115,22.115\n          C309.85,124.524,299.947,134.428,287.734,134.428z\n          M352.755,369.766l-36.071-92.343c-1.529-3.918-4.825-8.753-16.995-17.245\n          c6.679-1.811,13.474-4.063,20.304-6.727c6.806-2.662,13.3-5.598,19.415-8.779c-3.156,14.381-2.282,20.196-0.732,24.162\n          l36.074,92.34L352.755,369.766z");
    			add_location(path1, file$8, 20, 8, 1281);
    			add_location(g0, file$8, 8, 6, 184);
    			attr_dev(g1, "id", "Layer_1_85_");
    			add_location(g1, file$8, 7, 4, 157);
    			add_location(g2, file$8, 6, 2, 149);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "x", "0px");
    			attr_dev(svg, "y", "0px");
    			attr_dev(svg, "class", "fill-current text-white inline-block h-6 w-6 mr-3");
    			attr_dev(svg, "viewBox", "0 0 440 440");
    			add_location(svg, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g2);
    			append_dev(g2, g1);
    			append_dev(g1, g0);
    			append_dev(g0, path0);
    			append_dev(g0, path1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Logo', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Logo> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Logo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Logo",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    /* node_modules/svetamat/src/widgets/InputStd.svelte generated by Svelte v3.59.2 */
    const file$7 = "node_modules/svetamat/src/widgets/InputStd.svelte";

    // (119:2) {#if !hideDetails}
    function create_if_block$4(ctx) {
    	let div;
    	let t;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*helperText*/ ctx[3]);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*helperTextCls*/ ctx[15]) + " svelte-1cqey10"));
    			add_location(div, file$7, 119, 4, 3345);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*helperText*/ 8) set_data_dev(t, /*helperText*/ ctx[3]);

    			if (dirty[0] & /*helperTextCls*/ 32768 && div_class_value !== (div_class_value = "" + (null_to_empty(/*helperTextCls*/ ctx[15]) + " svelte-1cqey10"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(119:2) {#if !hideDetails}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div3;
    	let div2;
    	let label_1;
    	let t0;
    	let label_1_style_value;
    	let label_1_class_value;
    	let t1;
    	let div1;
    	let input;
    	let t2;
    	let div0;
    	let i0;
    	let t3;
    	let i0_class_value;
    	let t4;
    	let i1;
    	let t5;
    	let i1_class_value;
    	let div2_class_value;
    	let t6;
    	let div3_resize_listener;
    	let mounted;
    	let dispose;
    	let if_block = !/*hideDetails*/ ctx[7] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			div1 = element("div");
    			input = element("input");
    			t2 = space();
    			div0 = element("div");
    			i0 = element("i");
    			t3 = text("clear");
    			t4 = space();
    			i1 = element("i");
    			t5 = text(/*icon*/ ctx[4]);
    			t6 = space();
    			if (if_block) if_block.c();
    			attr_dev(label_1, "style", label_1_style_value = `${/*labelTopPadding*/ ctx[16]} max-width:${/*boxWidth*/ ctx[11]}px;`);
    			attr_dev(label_1, "class", label_1_class_value = "" + (null_to_empty(`${/*labelCls*/ ctx[13]} truncate`) + " svelte-1cqey10"));
    			add_location(label_1, file$7, 92, 4, 2348);
    			attr_dev(input, "type", /*type*/ ctx[12]);
    			input.readOnly = /*readonly*/ ctx[8];
    			input.value = /*value*/ ctx[0];
    			input.disabled = /*disabled*/ ctx[6];
    			attr_dev(input, "style", /*inputPadBottom*/ ctx[14]);
    			attr_dev(input, "class", "pt-6 appearance-none bg-transparent border-none w-full text-gray-800 px-2 focus:outline-none");
    			add_location(input, file$7, 98, 6, 2531);

    			attr_dev(i0, "class", i0_class_value = /*clearable*/ ctx[5] && !/*disabled*/ ctx[6]
    			? 'material-icons md-18 mr-2 cursor-pointer'
    			: '');

    			toggle_class(i0, "hidden", !/*clearable*/ ctx[5] || /*disabled*/ ctx[6]);
    			add_location(i0, file$7, 111, 8, 3044);
    			attr_dev(i1, "class", i1_class_value = "" + (null_to_empty(/*iconCls*/ ctx[10]) + " svelte-1cqey10"));
    			toggle_class(i1, "opacity-50", /*disabled*/ ctx[6]);
    			add_location(i1, file$7, 114, 8, 3222);
    			attr_dev(div0, "class", "float-right flex items-center mr-2");
    			add_location(div0, file$7, 110, 6, 2986);
    			attr_dev(div1, "class", "flex justify-between");
    			add_location(div1, file$7, 97, 4, 2489);

    			attr_dev(div2, "class", div2_class_value = "" + (null_to_empty(/*hasFocus*/ ctx[9]
    			? `relative rounded-t border-b-2 bg-gray-300 ${/*borderColor*/ ctx[2]}`
    			: `relative rounded-t border-b border-gray-500${/*disabled*/ ctx[6]
				? ''
				: ' hover:border-gray-900 hover:bg-gray-100'}`) + " svelte-1cqey10"));

    			toggle_class(div2, "opacity-50", /*disabled*/ ctx[6]);
    			toggle_class(div2, "disabled", /*disabled*/ ctx[6]);
    			add_location(div2, file$7, 85, 2, 2086);
    			attr_dev(div3, "class", "flex flex-col");
    			add_render_callback(() => /*div3_elementresize_handler*/ ctx[31].call(div3));
    			add_location(div3, file$7, 84, 0, 2027);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, label_1);
    			append_dev(label_1, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(i0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, i1);
    			append_dev(i1, t5);
    			append_dev(div3, t6);
    			if (if_block) if_block.m(div3, null);
    			div3_resize_listener = add_iframe_resize_listener(div3, /*div3_elementresize_handler*/ ctx[31].bind(div3));

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*handleInput*/ ctx[18], false, false, false, false),
    					listen_dev(input, "focus", /*focus_handler_1*/ ctx[29], false, false, false, false),
    					listen_dev(input, "blur", /*blur_handler_1*/ ctx[30], false, false, false, false),
    					listen_dev(input, "focus", /*focus_handler*/ ctx[25], false, false, false, false),
    					listen_dev(input, "blur", /*blur_handler*/ ctx[26], false, false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler*/ ctx[27], false, false, false, false),
    					listen_dev(input, "click", /*click_handler*/ ctx[28], false, false, false, false),
    					listen_dev(i0, "click", /*clear*/ ctx[19], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*label*/ 2) set_data_dev(t0, /*label*/ ctx[1]);

    			if (dirty[0] & /*labelTopPadding, boxWidth*/ 67584 && label_1_style_value !== (label_1_style_value = `${/*labelTopPadding*/ ctx[16]} max-width:${/*boxWidth*/ ctx[11]}px;`)) {
    				attr_dev(label_1, "style", label_1_style_value);
    			}

    			if (dirty[0] & /*labelCls*/ 8192 && label_1_class_value !== (label_1_class_value = "" + (null_to_empty(`${/*labelCls*/ ctx[13]} truncate`) + " svelte-1cqey10"))) {
    				attr_dev(label_1, "class", label_1_class_value);
    			}

    			if (dirty[0] & /*type*/ 4096) {
    				attr_dev(input, "type", /*type*/ ctx[12]);
    			}

    			if (dirty[0] & /*readonly*/ 256) {
    				prop_dev(input, "readOnly", /*readonly*/ ctx[8]);
    			}

    			if (dirty[0] & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				prop_dev(input, "value", /*value*/ ctx[0]);
    			}

    			if (dirty[0] & /*disabled*/ 64) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[6]);
    			}

    			if (dirty[0] & /*inputPadBottom*/ 16384) {
    				attr_dev(input, "style", /*inputPadBottom*/ ctx[14]);
    			}

    			if (dirty[0] & /*clearable, disabled*/ 96 && i0_class_value !== (i0_class_value = /*clearable*/ ctx[5] && !/*disabled*/ ctx[6]
    			? 'material-icons md-18 mr-2 cursor-pointer'
    			: '')) {
    				attr_dev(i0, "class", i0_class_value);
    			}

    			if (dirty[0] & /*clearable, disabled, clearable, disabled*/ 96) {
    				toggle_class(i0, "hidden", !/*clearable*/ ctx[5] || /*disabled*/ ctx[6]);
    			}

    			if (dirty[0] & /*icon*/ 16) set_data_dev(t5, /*icon*/ ctx[4]);

    			if (dirty[0] & /*iconCls*/ 1024 && i1_class_value !== (i1_class_value = "" + (null_to_empty(/*iconCls*/ ctx[10]) + " svelte-1cqey10"))) {
    				attr_dev(i1, "class", i1_class_value);
    			}

    			if (dirty[0] & /*iconCls, disabled*/ 1088) {
    				toggle_class(i1, "opacity-50", /*disabled*/ ctx[6]);
    			}

    			if (dirty[0] & /*hasFocus, borderColor, disabled*/ 580 && div2_class_value !== (div2_class_value = "" + (null_to_empty(/*hasFocus*/ ctx[9]
    			? `relative rounded-t border-b-2 bg-gray-300 ${/*borderColor*/ ctx[2]}`
    			: `relative rounded-t border-b border-gray-500${/*disabled*/ ctx[6]
				? ''
				: ' hover:border-gray-900 hover:bg-gray-100'}`) + " svelte-1cqey10"))) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (dirty[0] & /*hasFocus, borderColor, disabled, disabled*/ 580) {
    				toggle_class(div2, "opacity-50", /*disabled*/ ctx[6]);
    			}

    			if (dirty[0] & /*hasFocus, borderColor, disabled, disabled*/ 580) {
    				toggle_class(div2, "disabled", /*disabled*/ ctx[6]);
    			}

    			if (!/*hideDetails*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    			div3_resize_listener();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let labelTopPadding;
    	let helperTextCls;
    	let $y;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('InputStd', slots, []);
    	const dispatch = createEventDispatcher();
    	let { label = '' } = $$props;
    	let { value = '' } = $$props;
    	let { number = false } = $$props;
    	let { borderColor = 'border-gray-700' } = $$props;
    	let { labelColor = 'text-gray-700' } = $$props;
    	let { helperText = '' } = $$props;
    	let { helperTextColor = '' } = $$props;
    	let { icon = '' } = $$props;
    	let { clearable = false } = $$props;
    	let { disabled = false } = $$props;
    	let { hideDetails = false } = $$props;
    	let { readonly = false } = $$props;
    	let hasFocus = false;
    	let iconCls = '';
    	let boxWidth;

    	onMount(() => {
    		$$invalidate(10, iconCls = icon
    		? 'material-icons md-18 pointer-events-none'
    		: 'hidden');
    	});

    	const y = tweened(1, { duration: 50 });
    	validate_store(y, 'y');
    	component_subscribe($$self, y, value => $$invalidate(24, $y = value));
    	let type = 'text';

    	function handleInput(event) {
    		switch (type) {
    			case 'text':
    				$$invalidate(0, value = event.target.value);
    				break;
    			case 'number':
    				$$invalidate(0, value = +event.target.value);
    		}

    		dispatch('input', value);
    	}

    	let labelCls = 'absolute left-0 px-2 text-sm text-gray-600 pointer-events-none';
    	let inputPadBottom = '';

    	function setLabelColor(prefix) {
    		$$invalidate(13, labelCls = `${prefix} ${labelColor}`);
    	}

    	let valueEmpty = false;

    	function clear() {
    		$$invalidate(0, value = '');
    		dispatch('clear');
    	}

    	const writable_props = [
    		'label',
    		'value',
    		'number',
    		'borderColor',
    		'labelColor',
    		'helperText',
    		'helperTextColor',
    		'icon',
    		'clearable',
    		'disabled',
    		'hideDetails',
    		'readonly'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<InputStd> was created with unknown prop '${key}'`);
    	});

    	function focus_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function blur_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const focus_handler_1 = () => $$invalidate(9, hasFocus = true);
    	const blur_handler_1 = () => $$invalidate(9, hasFocus = false);

    	function div3_elementresize_handler() {
    		boxWidth = this.clientWidth;
    		$$invalidate(11, boxWidth);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('number' in $$props) $$invalidate(20, number = $$props.number);
    		if ('borderColor' in $$props) $$invalidate(2, borderColor = $$props.borderColor);
    		if ('labelColor' in $$props) $$invalidate(21, labelColor = $$props.labelColor);
    		if ('helperText' in $$props) $$invalidate(3, helperText = $$props.helperText);
    		if ('helperTextColor' in $$props) $$invalidate(22, helperTextColor = $$props.helperTextColor);
    		if ('icon' in $$props) $$invalidate(4, icon = $$props.icon);
    		if ('clearable' in $$props) $$invalidate(5, clearable = $$props.clearable);
    		if ('disabled' in $$props) $$invalidate(6, disabled = $$props.disabled);
    		if ('hideDetails' in $$props) $$invalidate(7, hideDetails = $$props.hideDetails);
    		if ('readonly' in $$props) $$invalidate(8, readonly = $$props.readonly);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		tweened,
    		createEventDispatcher,
    		dispatch,
    		label,
    		value,
    		number,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		hasFocus,
    		iconCls,
    		boxWidth,
    		y,
    		type,
    		handleInput,
    		labelCls,
    		inputPadBottom,
    		setLabelColor,
    		valueEmpty,
    		clear,
    		helperTextCls,
    		labelTopPadding,
    		$y
    	});

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('number' in $$props) $$invalidate(20, number = $$props.number);
    		if ('borderColor' in $$props) $$invalidate(2, borderColor = $$props.borderColor);
    		if ('labelColor' in $$props) $$invalidate(21, labelColor = $$props.labelColor);
    		if ('helperText' in $$props) $$invalidate(3, helperText = $$props.helperText);
    		if ('helperTextColor' in $$props) $$invalidate(22, helperTextColor = $$props.helperTextColor);
    		if ('icon' in $$props) $$invalidate(4, icon = $$props.icon);
    		if ('clearable' in $$props) $$invalidate(5, clearable = $$props.clearable);
    		if ('disabled' in $$props) $$invalidate(6, disabled = $$props.disabled);
    		if ('hideDetails' in $$props) $$invalidate(7, hideDetails = $$props.hideDetails);
    		if ('readonly' in $$props) $$invalidate(8, readonly = $$props.readonly);
    		if ('hasFocus' in $$props) $$invalidate(9, hasFocus = $$props.hasFocus);
    		if ('iconCls' in $$props) $$invalidate(10, iconCls = $$props.iconCls);
    		if ('boxWidth' in $$props) $$invalidate(11, boxWidth = $$props.boxWidth);
    		if ('type' in $$props) $$invalidate(12, type = $$props.type);
    		if ('labelCls' in $$props) $$invalidate(13, labelCls = $$props.labelCls);
    		if ('inputPadBottom' in $$props) $$invalidate(14, inputPadBottom = $$props.inputPadBottom);
    		if ('valueEmpty' in $$props) $$invalidate(23, valueEmpty = $$props.valueEmpty);
    		if ('helperTextCls' in $$props) $$invalidate(15, helperTextCls = $$props.helperTextCls);
    		if ('labelTopPadding' in $$props) $$invalidate(16, labelTopPadding = $$props.labelTopPadding);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*number*/ 1048576) {
    			if (number) $$invalidate(12, type = 'number');
    		}

    		if ($$self.$$.dirty[0] & /*$y*/ 16777216) {
    			$$invalidate(16, labelTopPadding = `transform:translateY(${$y}rem);`);
    		}

    		if ($$self.$$.dirty[0] & /*helperTextColor*/ 4194304) {
    			$$invalidate(15, helperTextCls = `text-sm px-2 font-light h-5 ${helperTextColor}`);
    		}

    		if ($$self.$$.dirty[0] & /*value*/ 1) {
    			$$invalidate(23, valueEmpty = value == null || value.toString().length === 0);
    		}

    		if ($$self.$$.dirty[0] & /*hasFocus, valueEmpty*/ 8389120) {
    			if (hasFocus) {
    				y.set(0.25);
    				setLabelColor('absolute left-0 px-2 text-sm pointer-events-none');
    				$$invalidate(14, inputPadBottom = 'padding-bottom:7px');
    			} else {
    				$$invalidate(14, inputPadBottom = 'padding-bottom:8px');
    				$$invalidate(13, labelCls = 'absolute left-0 px-2 text-sm pointer-events-none text-gray-600');

    				if (valueEmpty) {
    					y.set(1);
    					$$invalidate(13, labelCls = 'absolute left-0 px-2 pointer-events-none text-gray-600');
    				} else {
    					y.set(0.25);
    				}
    			}
    		}
    	};

    	return [
    		value,
    		label,
    		borderColor,
    		helperText,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		hasFocus,
    		iconCls,
    		boxWidth,
    		type,
    		labelCls,
    		inputPadBottom,
    		helperTextCls,
    		labelTopPadding,
    		y,
    		handleInput,
    		clear,
    		number,
    		labelColor,
    		helperTextColor,
    		valueEmpty,
    		$y,
    		focus_handler,
    		blur_handler,
    		keydown_handler,
    		click_handler,
    		focus_handler_1,
    		blur_handler_1,
    		div3_elementresize_handler
    	];
    }

    class InputStd extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$8,
    			create_fragment$8,
    			safe_not_equal,
    			{
    				label: 1,
    				value: 0,
    				number: 20,
    				borderColor: 2,
    				labelColor: 21,
    				helperText: 3,
    				helperTextColor: 22,
    				icon: 4,
    				clearable: 5,
    				disabled: 6,
    				hideDetails: 7,
    				readonly: 8
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputStd",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get label() {
    		throw new Error("<InputStd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<InputStd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<InputStd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<InputStd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get number() {
    		throw new Error("<InputStd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set number(value) {
    		throw new Error("<InputStd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderColor() {
    		throw new Error("<InputStd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderColor(value) {
    		throw new Error("<InputStd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelColor() {
    		throw new Error("<InputStd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelColor(value) {
    		throw new Error("<InputStd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helperText() {
    		throw new Error("<InputStd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helperText(value) {
    		throw new Error("<InputStd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helperTextColor() {
    		throw new Error("<InputStd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helperTextColor(value) {
    		throw new Error("<InputStd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<InputStd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<InputStd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clearable() {
    		throw new Error("<InputStd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clearable(value) {
    		throw new Error("<InputStd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<InputStd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<InputStd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideDetails() {
    		throw new Error("<InputStd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideDetails(value) {
    		throw new Error("<InputStd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get readonly() {
    		throw new Error("<InputStd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set readonly(value) {
    		throw new Error("<InputStd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svetamat/src/widgets/InputOutlined.svelte generated by Svelte v3.59.2 */
    const file$6 = "node_modules/svetamat/src/widgets/InputOutlined.svelte";

    // (135:2) {#if !hideDetails}
    function create_if_block$3(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*helperText*/ ctx[2]);
    			attr_dev(div, "class", /*helperTextCls*/ ctx[16]);
    			add_location(div, file$6, 135, 4, 3604);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*helperText*/ 4) set_data_dev(t, /*helperText*/ ctx[2]);

    			if (dirty[0] & /*helperTextCls*/ 65536) {
    				attr_dev(div, "class", /*helperTextCls*/ ctx[16]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(135:2) {#if !hideDetails}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div2;
    	let fieldset;
    	let legend;
    	let t0;
    	let t1;
    	let label_1;
    	let t2;
    	let label_1_style_value;
    	let label_1_class_value;
    	let label_1_resize_listener;
    	let t3;
    	let div1;
    	let input;
    	let t4;
    	let div0;
    	let i0;
    	let t5;
    	let i0_class_value;
    	let t6;
    	let i1;
    	let t7;
    	let fieldset_class_value;
    	let t8;
    	let div2_resize_listener;
    	let mounted;
    	let dispose;
    	let if_block = !/*hideDetails*/ ctx[6] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			fieldset = element("fieldset");
    			legend = element("legend");
    			t0 = text("​");
    			t1 = space();
    			label_1 = element("label");
    			t2 = text(/*label*/ ctx[1]);
    			t3 = space();
    			div1 = element("div");
    			input = element("input");
    			t4 = space();
    			div0 = element("div");
    			i0 = element("i");
    			t5 = text("clear");
    			t6 = space();
    			i1 = element("i");
    			t7 = text(/*icon*/ ctx[3]);
    			t8 = space();
    			if (if_block) if_block.c();
    			attr_dev(legend, "style", /*legendStyle*/ ctx[15]);
    			add_location(legend, file$6, 106, 4, 2464);
    			attr_dev(label_1, "style", label_1_style_value = `${/*labelTranslateStyle*/ ctx[17]} max-width:${/*boxWidth*/ ctx[11] - 16}px;`);
    			attr_dev(label_1, "class", label_1_class_value = `${/*labelCls*/ ctx[14]}absolute left-0 mx-2 pointer-events-none truncate`);
    			add_render_callback(() => /*label_1_elementresize_handler*/ ctx[30].call(label_1));
    			add_location(label_1, file$6, 107, 4, 2515);
    			attr_dev(input, "type", /*type*/ ctx[12]);
    			input.readOnly = /*readonly*/ ctx[7];
    			input.value = /*value*/ ctx[0];
    			input.disabled = /*disabled*/ ctx[5];
    			set_style(input, "padding-bottom", "3px");
    			attr_dev(input, "class", "h-8 appearance-none bg-transparent border-none w-full text-gray-800 px-2 focus:outline-none");
    			add_location(input, file$6, 114, 6, 2782);

    			attr_dev(i0, "class", i0_class_value = /*clearable*/ ctx[4] && !/*disabled*/ ctx[5]
    			? 'material-icons md-18 mr-2 cursor-pointer'
    			: '');

    			toggle_class(i0, "hidden", !/*clearable*/ ctx[4] || /*disabled*/ ctx[5]);
    			add_location(i0, file$6, 127, 8, 3298);
    			attr_dev(i1, "class", /*iconCls*/ ctx[10]);
    			toggle_class(i1, "opacity-50", /*disabled*/ ctx[5]);
    			add_location(i1, file$6, 130, 8, 3476);
    			attr_dev(div0, "class", "float-right flex items-center mr-2");
    			add_location(div0, file$6, 126, 6, 3240);
    			attr_dev(div1, "class", "flex justify-between");
    			add_location(div1, file$6, 113, 4, 2740);
    			fieldset.disabled = /*disabled*/ ctx[5];
    			set_style(fieldset, "height", "59px");
    			attr_dev(fieldset, "class", fieldset_class_value = `${/*fieldsetCls*/ ctx[13]}relative rounded`);
    			toggle_class(fieldset, "opacity-50", /*disabled*/ ctx[5]);
    			add_location(fieldset, file$6, 104, 2, 2332);
    			attr_dev(div2, "class", "flex flex-col");
    			add_render_callback(() => /*div2_elementresize_handler*/ ctx[33].call(div2));
    			add_location(div2, file$6, 103, 0, 2273);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, fieldset);
    			append_dev(fieldset, legend);
    			append_dev(legend, t0);
    			append_dev(fieldset, t1);
    			append_dev(fieldset, label_1);
    			append_dev(label_1, t2);
    			label_1_resize_listener = add_iframe_resize_listener(label_1, /*label_1_elementresize_handler*/ ctx[30].bind(label_1));
    			append_dev(fieldset, t3);
    			append_dev(fieldset, div1);
    			append_dev(div1, input);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(i0, t5);
    			append_dev(div0, t6);
    			append_dev(div0, i1);
    			append_dev(i1, t7);
    			append_dev(div2, t8);
    			if (if_block) if_block.m(div2, null);
    			div2_resize_listener = add_iframe_resize_listener(div2, /*div2_elementresize_handler*/ ctx[33].bind(div2));

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*handleInput*/ ctx[19], false, false, false, false),
    					listen_dev(input, "focus", /*focus_handler_1*/ ctx[31], false, false, false, false),
    					listen_dev(input, "blur", /*blur_handler_1*/ ctx[32], false, false, false, false),
    					listen_dev(input, "focus", /*focus_handler*/ ctx[26], false, false, false, false),
    					listen_dev(input, "blur", /*blur_handler*/ ctx[27], false, false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler*/ ctx[28], false, false, false, false),
    					listen_dev(input, "click", /*click_handler*/ ctx[29], false, false, false, false),
    					listen_dev(i0, "click", /*clear*/ ctx[20], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*legendStyle*/ 32768) {
    				attr_dev(legend, "style", /*legendStyle*/ ctx[15]);
    			}

    			if (dirty[0] & /*label*/ 2) set_data_dev(t2, /*label*/ ctx[1]);

    			if (dirty[0] & /*labelTranslateStyle, boxWidth*/ 133120 && label_1_style_value !== (label_1_style_value = `${/*labelTranslateStyle*/ ctx[17]} max-width:${/*boxWidth*/ ctx[11] - 16}px;`)) {
    				attr_dev(label_1, "style", label_1_style_value);
    			}

    			if (dirty[0] & /*labelCls*/ 16384 && label_1_class_value !== (label_1_class_value = `${/*labelCls*/ ctx[14]}absolute left-0 mx-2 pointer-events-none truncate`)) {
    				attr_dev(label_1, "class", label_1_class_value);
    			}

    			if (dirty[0] & /*type*/ 4096) {
    				attr_dev(input, "type", /*type*/ ctx[12]);
    			}

    			if (dirty[0] & /*readonly*/ 128) {
    				prop_dev(input, "readOnly", /*readonly*/ ctx[7]);
    			}

    			if (dirty[0] & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				prop_dev(input, "value", /*value*/ ctx[0]);
    			}

    			if (dirty[0] & /*disabled*/ 32) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[5]);
    			}

    			if (dirty[0] & /*clearable, disabled*/ 48 && i0_class_value !== (i0_class_value = /*clearable*/ ctx[4] && !/*disabled*/ ctx[5]
    			? 'material-icons md-18 mr-2 cursor-pointer'
    			: '')) {
    				attr_dev(i0, "class", i0_class_value);
    			}

    			if (dirty[0] & /*clearable, disabled, clearable, disabled*/ 48) {
    				toggle_class(i0, "hidden", !/*clearable*/ ctx[4] || /*disabled*/ ctx[5]);
    			}

    			if (dirty[0] & /*icon*/ 8) set_data_dev(t7, /*icon*/ ctx[3]);

    			if (dirty[0] & /*iconCls*/ 1024) {
    				attr_dev(i1, "class", /*iconCls*/ ctx[10]);
    			}

    			if (dirty[0] & /*iconCls, disabled*/ 1056) {
    				toggle_class(i1, "opacity-50", /*disabled*/ ctx[5]);
    			}

    			if (dirty[0] & /*disabled*/ 32) {
    				prop_dev(fieldset, "disabled", /*disabled*/ ctx[5]);
    			}

    			if (dirty[0] & /*fieldsetCls*/ 8192 && fieldset_class_value !== (fieldset_class_value = `${/*fieldsetCls*/ ctx[13]}relative rounded`)) {
    				attr_dev(fieldset, "class", fieldset_class_value);
    			}

    			if (dirty[0] & /*fieldsetCls, disabled*/ 8224) {
    				toggle_class(fieldset, "opacity-50", /*disabled*/ ctx[5]);
    			}

    			if (!/*hideDetails*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			label_1_resize_listener();
    			if (if_block) if_block.d();
    			div2_resize_listener();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let labelTranslateStyle;
    	let helperTextCls;
    	let $y;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('InputOutlined', slots, []);
    	const dispatch = createEventDispatcher();
    	let { label = '' } = $$props;
    	let { value = '' } = $$props;
    	let { number = false } = $$props;
    	let { borderColor = 'border-gray-700' } = $$props;
    	let { labelColor = 'text-gray-700' } = $$props;
    	let { helperText = '' } = $$props;
    	let { helperTextColor = '' } = $$props;
    	let { icon = '' } = $$props;
    	let { clearable = false } = $$props;
    	let { disabled = false } = $$props;
    	let { hideDetails = false } = $$props;
    	let { readonly = false } = $$props;
    	let hasFocus = false;
    	let iconCls = '';
    	let boxWidth;
    	const y = tweened(0.75, { duration: 50 });
    	validate_store(y, 'y');
    	component_subscribe($$self, y, value => $$invalidate(25, $y = value));
    	let type = 'text';

    	function handleInput(event) {
    		switch (type) {
    			case 'text':
    				$$invalidate(0, value = event.target.value);
    				break;
    			case 'number':
    				$$invalidate(0, value = +event.target.value);
    		}

    		dispatch('input', value);
    	}

    	let fieldsetCls = 'border border-gray-500';
    	let labelCls = 'text-gray-600 ';
    	let legendStyle = '';
    	let labelWidth;

    	onMount(() => {
    		$$invalidate(10, iconCls = icon
    		? 'material-icons md-18 pointer-events-none'
    		: 'hidden');
    	});

    	function setFocusState() {
    		$$invalidate(14, labelCls = `text-sm ${labelColor} `);
    		y.set(-1.35);
    		$$invalidate(13, fieldsetCls = `border-2 ${borderColor} `);
    	}

    	function setFieldsetCls(cls) {
    		$$invalidate(13, fieldsetCls = cls + ' ');
    	}

    	function setLabelCls(cls) {
    		$$invalidate(14, labelCls = cls + ' ');
    	}

    	function setLegendStyle(style) {
    		$$invalidate(15, legendStyle = style);
    	}

    	function clear() {
    		$$invalidate(0, value = '');
    		dispatch('clear');
    	}

    	const writable_props = [
    		'label',
    		'value',
    		'number',
    		'borderColor',
    		'labelColor',
    		'helperText',
    		'helperTextColor',
    		'icon',
    		'clearable',
    		'disabled',
    		'hideDetails',
    		'readonly'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<InputOutlined> was created with unknown prop '${key}'`);
    	});

    	function focus_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function blur_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function label_1_elementresize_handler() {
    		labelWidth = this.clientWidth;
    		$$invalidate(9, labelWidth);
    	}

    	const focus_handler_1 = () => $$invalidate(8, hasFocus = true);
    	const blur_handler_1 = () => $$invalidate(8, hasFocus = false);

    	function div2_elementresize_handler() {
    		boxWidth = this.clientWidth;
    		$$invalidate(11, boxWidth);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('number' in $$props) $$invalidate(21, number = $$props.number);
    		if ('borderColor' in $$props) $$invalidate(22, borderColor = $$props.borderColor);
    		if ('labelColor' in $$props) $$invalidate(23, labelColor = $$props.labelColor);
    		if ('helperText' in $$props) $$invalidate(2, helperText = $$props.helperText);
    		if ('helperTextColor' in $$props) $$invalidate(24, helperTextColor = $$props.helperTextColor);
    		if ('icon' in $$props) $$invalidate(3, icon = $$props.icon);
    		if ('clearable' in $$props) $$invalidate(4, clearable = $$props.clearable);
    		if ('disabled' in $$props) $$invalidate(5, disabled = $$props.disabled);
    		if ('hideDetails' in $$props) $$invalidate(6, hideDetails = $$props.hideDetails);
    		if ('readonly' in $$props) $$invalidate(7, readonly = $$props.readonly);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		tweened,
    		createEventDispatcher,
    		dispatch,
    		label,
    		value,
    		number,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		hasFocus,
    		iconCls,
    		boxWidth,
    		y,
    		type,
    		handleInput,
    		fieldsetCls,
    		labelCls,
    		legendStyle,
    		labelWidth,
    		setFocusState,
    		setFieldsetCls,
    		setLabelCls,
    		setLegendStyle,
    		clear,
    		helperTextCls,
    		labelTranslateStyle,
    		$y
    	});

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('number' in $$props) $$invalidate(21, number = $$props.number);
    		if ('borderColor' in $$props) $$invalidate(22, borderColor = $$props.borderColor);
    		if ('labelColor' in $$props) $$invalidate(23, labelColor = $$props.labelColor);
    		if ('helperText' in $$props) $$invalidate(2, helperText = $$props.helperText);
    		if ('helperTextColor' in $$props) $$invalidate(24, helperTextColor = $$props.helperTextColor);
    		if ('icon' in $$props) $$invalidate(3, icon = $$props.icon);
    		if ('clearable' in $$props) $$invalidate(4, clearable = $$props.clearable);
    		if ('disabled' in $$props) $$invalidate(5, disabled = $$props.disabled);
    		if ('hideDetails' in $$props) $$invalidate(6, hideDetails = $$props.hideDetails);
    		if ('readonly' in $$props) $$invalidate(7, readonly = $$props.readonly);
    		if ('hasFocus' in $$props) $$invalidate(8, hasFocus = $$props.hasFocus);
    		if ('iconCls' in $$props) $$invalidate(10, iconCls = $$props.iconCls);
    		if ('boxWidth' in $$props) $$invalidate(11, boxWidth = $$props.boxWidth);
    		if ('type' in $$props) $$invalidate(12, type = $$props.type);
    		if ('fieldsetCls' in $$props) $$invalidate(13, fieldsetCls = $$props.fieldsetCls);
    		if ('labelCls' in $$props) $$invalidate(14, labelCls = $$props.labelCls);
    		if ('legendStyle' in $$props) $$invalidate(15, legendStyle = $$props.legendStyle);
    		if ('labelWidth' in $$props) $$invalidate(9, labelWidth = $$props.labelWidth);
    		if ('helperTextCls' in $$props) $$invalidate(16, helperTextCls = $$props.helperTextCls);
    		if ('labelTranslateStyle' in $$props) $$invalidate(17, labelTranslateStyle = $$props.labelTranslateStyle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*number*/ 2097152) {
    			if (number) $$invalidate(12, type = 'number');
    		}

    		if ($$self.$$.dirty[0] & /*$y*/ 33554432) {
    			$$invalidate(17, labelTranslateStyle = `transform:translateY(${$y}rem);`);
    		}

    		if ($$self.$$.dirty[0] & /*helperTextColor*/ 16777216) {
    			$$invalidate(16, helperTextCls = `text-sm px-2 font-light h-5 ${helperTextColor}`);
    		}

    		if ($$self.$$.dirty[0] & /*labelWidth, hasFocus, value*/ 769) {
    			if (labelWidth) {
    				if (!hasFocus && (value == null || value.toString().length === 0)) {
    					setLegendStyle('');
    				} else {
    					setLegendStyle(`width:${labelWidth + 4}px;margin-left:6px;`);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*hasFocus, disabled, value*/ 289) {
    			if (hasFocus) {
    				setFocusState();
    			} else {
    				if (!disabled) {
    					setFieldsetCls('border border-gray-500 hover:border-gray-900');
    				} else {
    					setFieldsetCls('border');
    				}

    				if (value == null || value.toString().length === 0) {
    					setLabelCls('text-gray-600');
    					y.set(-0.15);
    				} else {
    					setLabelCls('text-sm text-gray-600');
    					y.set(-1.35);
    				}
    			}
    		}
    	};

    	return [
    		value,
    		label,
    		helperText,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		hasFocus,
    		labelWidth,
    		iconCls,
    		boxWidth,
    		type,
    		fieldsetCls,
    		labelCls,
    		legendStyle,
    		helperTextCls,
    		labelTranslateStyle,
    		y,
    		handleInput,
    		clear,
    		number,
    		borderColor,
    		labelColor,
    		helperTextColor,
    		$y,
    		focus_handler,
    		blur_handler,
    		keydown_handler,
    		click_handler,
    		label_1_elementresize_handler,
    		focus_handler_1,
    		blur_handler_1,
    		div2_elementresize_handler
    	];
    }

    class InputOutlined extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$7,
    			create_fragment$7,
    			safe_not_equal,
    			{
    				label: 1,
    				value: 0,
    				number: 21,
    				borderColor: 22,
    				labelColor: 23,
    				helperText: 2,
    				helperTextColor: 24,
    				icon: 3,
    				clearable: 4,
    				disabled: 5,
    				hideDetails: 6,
    				readonly: 7
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputOutlined",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get label() {
    		throw new Error("<InputOutlined>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<InputOutlined>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<InputOutlined>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<InputOutlined>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get number() {
    		throw new Error("<InputOutlined>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set number(value) {
    		throw new Error("<InputOutlined>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderColor() {
    		throw new Error("<InputOutlined>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderColor(value) {
    		throw new Error("<InputOutlined>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelColor() {
    		throw new Error("<InputOutlined>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelColor(value) {
    		throw new Error("<InputOutlined>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helperText() {
    		throw new Error("<InputOutlined>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helperText(value) {
    		throw new Error("<InputOutlined>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helperTextColor() {
    		throw new Error("<InputOutlined>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helperTextColor(value) {
    		throw new Error("<InputOutlined>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<InputOutlined>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<InputOutlined>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clearable() {
    		throw new Error("<InputOutlined>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clearable(value) {
    		throw new Error("<InputOutlined>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<InputOutlined>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<InputOutlined>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideDetails() {
    		throw new Error("<InputOutlined>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideDetails(value) {
    		throw new Error("<InputOutlined>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get readonly() {
    		throw new Error("<InputOutlined>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set readonly(value) {
    		throw new Error("<InputOutlined>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svetamat/src/widgets/Input.svelte generated by Svelte v3.59.2 */

    // (33:0) {:else}
    function create_else_block$1(ctx) {
    	let inputoutlined;
    	let updating_value;
    	let current;

    	function inputoutlined_value_binding(value) {
    		/*inputoutlined_value_binding*/ ctx[20](value);
    	}

    	let inputoutlined_props = {
    		label: /*label*/ ctx[1],
    		borderColor: /*borderColor*/ ctx[3],
    		labelColor: /*labelColor*/ ctx[4],
    		helperText: /*helperText*/ ctx[5],
    		icon: /*icon*/ ctx[8],
    		number: /*number*/ ctx[2],
    		clearable: /*clearable*/ ctx[9],
    		disabled: /*disabled*/ ctx[10],
    		hideDetails: /*hideDetails*/ ctx[11],
    		readonly: /*readonly*/ ctx[12],
    		helperTextColor: /*helperTextColor*/ ctx[6]
    	};

    	if (/*value*/ ctx[0] !== void 0) {
    		inputoutlined_props.value = /*value*/ ctx[0];
    	}

    	inputoutlined = new InputOutlined({
    			props: inputoutlined_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(inputoutlined, 'value', inputoutlined_value_binding));
    	inputoutlined.$on("focus", /*focus_handler_1*/ ctx[21]);
    	inputoutlined.$on("blur", /*blur_handler_1*/ ctx[22]);
    	inputoutlined.$on("keydown", /*keydown_handler_1*/ ctx[23]);
    	inputoutlined.$on("clear", /*clear_handler_1*/ ctx[24]);
    	inputoutlined.$on("click", /*click_handler_1*/ ctx[25]);
    	inputoutlined.$on("input", /*input_handler_1*/ ctx[26]);

    	const block = {
    		c: function create() {
    			create_component(inputoutlined.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(inputoutlined, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const inputoutlined_changes = {};
    			if (dirty & /*label*/ 2) inputoutlined_changes.label = /*label*/ ctx[1];
    			if (dirty & /*borderColor*/ 8) inputoutlined_changes.borderColor = /*borderColor*/ ctx[3];
    			if (dirty & /*labelColor*/ 16) inputoutlined_changes.labelColor = /*labelColor*/ ctx[4];
    			if (dirty & /*helperText*/ 32) inputoutlined_changes.helperText = /*helperText*/ ctx[5];
    			if (dirty & /*icon*/ 256) inputoutlined_changes.icon = /*icon*/ ctx[8];
    			if (dirty & /*number*/ 4) inputoutlined_changes.number = /*number*/ ctx[2];
    			if (dirty & /*clearable*/ 512) inputoutlined_changes.clearable = /*clearable*/ ctx[9];
    			if (dirty & /*disabled*/ 1024) inputoutlined_changes.disabled = /*disabled*/ ctx[10];
    			if (dirty & /*hideDetails*/ 2048) inputoutlined_changes.hideDetails = /*hideDetails*/ ctx[11];
    			if (dirty & /*readonly*/ 4096) inputoutlined_changes.readonly = /*readonly*/ ctx[12];
    			if (dirty & /*helperTextColor*/ 64) inputoutlined_changes.helperTextColor = /*helperTextColor*/ ctx[6];

    			if (!updating_value && dirty & /*value*/ 1) {
    				updating_value = true;
    				inputoutlined_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputoutlined.$set(inputoutlined_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputoutlined.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputoutlined.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inputoutlined, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(33:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (24:0) {#if !outlined}
    function create_if_block$2(ctx) {
    	let inputstd;
    	let updating_value;
    	let current;

    	function inputstd_value_binding(value) {
    		/*inputstd_value_binding*/ ctx[13](value);
    	}

    	let inputstd_props = {
    		label: /*label*/ ctx[1],
    		borderColor: /*borderColor*/ ctx[3],
    		labelColor: /*labelColor*/ ctx[4],
    		helperText: /*helperText*/ ctx[5],
    		icon: /*icon*/ ctx[8],
    		number: /*number*/ ctx[2],
    		clearable: /*clearable*/ ctx[9],
    		disabled: /*disabled*/ ctx[10],
    		hideDetails: /*hideDetails*/ ctx[11],
    		readonly: /*readonly*/ ctx[12],
    		helperTextColor: /*helperTextColor*/ ctx[6]
    	};

    	if (/*value*/ ctx[0] !== void 0) {
    		inputstd_props.value = /*value*/ ctx[0];
    	}

    	inputstd = new InputStd({ props: inputstd_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputstd, 'value', inputstd_value_binding));
    	inputstd.$on("focus", /*focus_handler*/ ctx[14]);
    	inputstd.$on("blur", /*blur_handler*/ ctx[15]);
    	inputstd.$on("keydown", /*keydown_handler*/ ctx[16]);
    	inputstd.$on("clear", /*clear_handler*/ ctx[17]);
    	inputstd.$on("click", /*click_handler*/ ctx[18]);
    	inputstd.$on("input", /*input_handler*/ ctx[19]);

    	const block = {
    		c: function create() {
    			create_component(inputstd.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(inputstd, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const inputstd_changes = {};
    			if (dirty & /*label*/ 2) inputstd_changes.label = /*label*/ ctx[1];
    			if (dirty & /*borderColor*/ 8) inputstd_changes.borderColor = /*borderColor*/ ctx[3];
    			if (dirty & /*labelColor*/ 16) inputstd_changes.labelColor = /*labelColor*/ ctx[4];
    			if (dirty & /*helperText*/ 32) inputstd_changes.helperText = /*helperText*/ ctx[5];
    			if (dirty & /*icon*/ 256) inputstd_changes.icon = /*icon*/ ctx[8];
    			if (dirty & /*number*/ 4) inputstd_changes.number = /*number*/ ctx[2];
    			if (dirty & /*clearable*/ 512) inputstd_changes.clearable = /*clearable*/ ctx[9];
    			if (dirty & /*disabled*/ 1024) inputstd_changes.disabled = /*disabled*/ ctx[10];
    			if (dirty & /*hideDetails*/ 2048) inputstd_changes.hideDetails = /*hideDetails*/ ctx[11];
    			if (dirty & /*readonly*/ 4096) inputstd_changes.readonly = /*readonly*/ ctx[12];
    			if (dirty & /*helperTextColor*/ 64) inputstd_changes.helperTextColor = /*helperTextColor*/ ctx[6];

    			if (!updating_value && dirty & /*value*/ 1) {
    				updating_value = true;
    				inputstd_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputstd.$set(inputstd_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputstd.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputstd.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inputstd, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(24:0) {#if !outlined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*outlined*/ ctx[7]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Input', slots, []);
    	let { label = '' } = $$props;
    	let { value = '' } = $$props;
    	let { number = false } = $$props;
    	let { borderColor = 'border-gray-700' } = $$props;
    	let { labelColor = 'text-gray-700' } = $$props;
    	let { helperText = '' } = $$props;
    	let { helperTextColor = '' } = $$props;
    	let { outlined = false } = $$props;
    	let { icon = '' } = $$props;
    	let { clearable = false } = $$props;
    	let { disabled = false } = $$props;
    	let { hideDetails = false } = $$props;
    	let { readonly = false } = $$props;
    	let hasFocus = false;
    	let labelCls = 'absolute left-0 px-2 text-sm text-gray-600';
    	let outlinedlabelCls = '';

    	const writable_props = [
    		'label',
    		'value',
    		'number',
    		'borderColor',
    		'labelColor',
    		'helperText',
    		'helperTextColor',
    		'outlined',
    		'icon',
    		'clearable',
    		'disabled',
    		'hideDetails',
    		'readonly'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	function inputstd_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	function focus_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function blur_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function clear_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function inputoutlined_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	function focus_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function blur_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function clear_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('number' in $$props) $$invalidate(2, number = $$props.number);
    		if ('borderColor' in $$props) $$invalidate(3, borderColor = $$props.borderColor);
    		if ('labelColor' in $$props) $$invalidate(4, labelColor = $$props.labelColor);
    		if ('helperText' in $$props) $$invalidate(5, helperText = $$props.helperText);
    		if ('helperTextColor' in $$props) $$invalidate(6, helperTextColor = $$props.helperTextColor);
    		if ('outlined' in $$props) $$invalidate(7, outlined = $$props.outlined);
    		if ('icon' in $$props) $$invalidate(8, icon = $$props.icon);
    		if ('clearable' in $$props) $$invalidate(9, clearable = $$props.clearable);
    		if ('disabled' in $$props) $$invalidate(10, disabled = $$props.disabled);
    		if ('hideDetails' in $$props) $$invalidate(11, hideDetails = $$props.hideDetails);
    		if ('readonly' in $$props) $$invalidate(12, readonly = $$props.readonly);
    	};

    	$$self.$capture_state = () => ({
    		InputStd,
    		InputOutlined,
    		label,
    		value,
    		number,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		outlined,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		hasFocus,
    		labelCls,
    		outlinedlabelCls
    	});

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('number' in $$props) $$invalidate(2, number = $$props.number);
    		if ('borderColor' in $$props) $$invalidate(3, borderColor = $$props.borderColor);
    		if ('labelColor' in $$props) $$invalidate(4, labelColor = $$props.labelColor);
    		if ('helperText' in $$props) $$invalidate(5, helperText = $$props.helperText);
    		if ('helperTextColor' in $$props) $$invalidate(6, helperTextColor = $$props.helperTextColor);
    		if ('outlined' in $$props) $$invalidate(7, outlined = $$props.outlined);
    		if ('icon' in $$props) $$invalidate(8, icon = $$props.icon);
    		if ('clearable' in $$props) $$invalidate(9, clearable = $$props.clearable);
    		if ('disabled' in $$props) $$invalidate(10, disabled = $$props.disabled);
    		if ('hideDetails' in $$props) $$invalidate(11, hideDetails = $$props.hideDetails);
    		if ('readonly' in $$props) $$invalidate(12, readonly = $$props.readonly);
    		if ('hasFocus' in $$props) hasFocus = $$props.hasFocus;
    		if ('labelCls' in $$props) labelCls = $$props.labelCls;
    		if ('outlinedlabelCls' in $$props) outlinedlabelCls = $$props.outlinedlabelCls;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		value,
    		label,
    		number,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		outlined,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		inputstd_value_binding,
    		focus_handler,
    		blur_handler,
    		keydown_handler,
    		clear_handler,
    		click_handler,
    		input_handler,
    		inputoutlined_value_binding,
    		focus_handler_1,
    		blur_handler_1,
    		keydown_handler_1,
    		clear_handler_1,
    		click_handler_1,
    		input_handler_1
    	];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			label: 1,
    			value: 0,
    			number: 2,
    			borderColor: 3,
    			labelColor: 4,
    			helperText: 5,
    			helperTextColor: 6,
    			outlined: 7,
    			icon: 8,
    			clearable: 9,
    			disabled: 10,
    			hideDetails: 11,
    			readonly: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get label() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get number() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set number(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderColor() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderColor(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelColor() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelColor(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helperText() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helperText(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helperTextColor() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helperTextColor(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlined() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clearable() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clearable(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideDetails() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideDetails(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get readonly() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set readonly(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svetamat/src/widgets/Button.svelte generated by Svelte v3.59.2 */

    const file$5 = "node_modules/svetamat/src/widgets/Button.svelte";

    function create_fragment$5(ctx) {
    	let button;
    	let button_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[17].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], null);

    	const block_1 = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", button_class_value = `${/*cls*/ ctx[1]} ${/*disabledCls*/ ctx[2]}`);
    			button.disabled = /*disabled*/ ctx[0];
    			add_location(button, file$5, 68, 0, 1502);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[18], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 65536)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[16],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[16])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[16], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*cls, disabledCls*/ 6 && button_class_value !== (button_class_value = `${/*cls*/ ctx[1]} ${/*disabledCls*/ ctx[2]}`)) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (!current || dirty & /*disabled*/ 1) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, ['default']);
    	let { text = false } = $$props;
    	let { fab = false } = $$props;
    	let { outlined = false } = $$props;
    	let { rounded = false } = $$props;
    	let { tile = false } = $$props;
    	let { block = false } = $$props;
    	let { xs = false } = $$props;
    	let { sm = false } = $$props;
    	let { lg = false } = $$props;
    	let { xl = false } = $$props;
    	let { disabled = false } = $$props;
    	let { textColor = 'text-black' } = $$props;
    	let { outlineColor = 'border-black' } = $$props;
    	let { bgColor = 'bg-transparent' } = $$props;
    	let cls = 'focus:outline-none uppercase tracking-wide';

    	if (outlined) {
    		cls += ` border border-solid ${textColor} ${outlineColor} ${bgColor}`;
    	} else if (text) {
    		cls += ` ${textColor} ${bgColor}`;
    	} else {
    		cls += ` elevation-2 ${textColor} ${bgColor}`;
    	}

    	if (rounded) {
    		cls += ' rounded-full';
    	}

    	if (fab) {
    		cls += ' rounded-full flex items-center justify-center';
    	}

    	if (!tile) {
    		cls += ' rounded';
    	}

    	if (block) {
    		cls += ' block w-full';
    	}

    	if (xs) {
    		cls += ' h-5 text-xs px-2';
    	} else if (sm) {
    		cls += ' h-6 text-sm px-3';
    	} else if (lg) {
    		cls += ' h-10 text-lg px-5';
    	} else if (xl) {
    		cls += ' h-12 text-xl px-6';
    	} else {
    		cls += ' h-8 text-base px-4';
    	}

    	cls = cls.trim();
    	let disabledCls;

    	const writable_props = [
    		'text',
    		'fab',
    		'outlined',
    		'rounded',
    		'tile',
    		'block',
    		'xs',
    		'sm',
    		'lg',
    		'xl',
    		'disabled',
    		'textColor',
    		'outlineColor',
    		'bgColor'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('text' in $$props) $$invalidate(3, text = $$props.text);
    		if ('fab' in $$props) $$invalidate(4, fab = $$props.fab);
    		if ('outlined' in $$props) $$invalidate(5, outlined = $$props.outlined);
    		if ('rounded' in $$props) $$invalidate(6, rounded = $$props.rounded);
    		if ('tile' in $$props) $$invalidate(7, tile = $$props.tile);
    		if ('block' in $$props) $$invalidate(8, block = $$props.block);
    		if ('xs' in $$props) $$invalidate(9, xs = $$props.xs);
    		if ('sm' in $$props) $$invalidate(10, sm = $$props.sm);
    		if ('lg' in $$props) $$invalidate(11, lg = $$props.lg);
    		if ('xl' in $$props) $$invalidate(12, xl = $$props.xl);
    		if ('disabled' in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ('textColor' in $$props) $$invalidate(13, textColor = $$props.textColor);
    		if ('outlineColor' in $$props) $$invalidate(14, outlineColor = $$props.outlineColor);
    		if ('bgColor' in $$props) $$invalidate(15, bgColor = $$props.bgColor);
    		if ('$$scope' in $$props) $$invalidate(16, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		text,
    		fab,
    		outlined,
    		rounded,
    		tile,
    		block,
    		xs,
    		sm,
    		lg,
    		xl,
    		disabled,
    		textColor,
    		outlineColor,
    		bgColor,
    		cls,
    		disabledCls
    	});

    	$$self.$inject_state = $$props => {
    		if ('text' in $$props) $$invalidate(3, text = $$props.text);
    		if ('fab' in $$props) $$invalidate(4, fab = $$props.fab);
    		if ('outlined' in $$props) $$invalidate(5, outlined = $$props.outlined);
    		if ('rounded' in $$props) $$invalidate(6, rounded = $$props.rounded);
    		if ('tile' in $$props) $$invalidate(7, tile = $$props.tile);
    		if ('block' in $$props) $$invalidate(8, block = $$props.block);
    		if ('xs' in $$props) $$invalidate(9, xs = $$props.xs);
    		if ('sm' in $$props) $$invalidate(10, sm = $$props.sm);
    		if ('lg' in $$props) $$invalidate(11, lg = $$props.lg);
    		if ('xl' in $$props) $$invalidate(12, xl = $$props.xl);
    		if ('disabled' in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ('textColor' in $$props) $$invalidate(13, textColor = $$props.textColor);
    		if ('outlineColor' in $$props) $$invalidate(14, outlineColor = $$props.outlineColor);
    		if ('bgColor' in $$props) $$invalidate(15, bgColor = $$props.bgColor);
    		if ('cls' in $$props) $$invalidate(1, cls = $$props.cls);
    		if ('disabledCls' in $$props) $$invalidate(2, disabledCls = $$props.disabledCls);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*disabled, outlined, text*/ 41) {
    			if (disabled) {
    				$$invalidate(2, disabledCls = 'opacity-25 cursor-not-allowed');
    			} else {
    				let hover;

    				if (outlined) {
    					hover = 'hover:elevation-1';
    				} else if (text) {
    					hover = 'hover:elevation-1';
    				} else {
    					hover = 'hover:elevation-4';
    				}

    				$$invalidate(2, disabledCls = `${hover} active:elevation-0 ripple`);
    			}
    		}
    	};

    	return [
    		disabled,
    		cls,
    		disabledCls,
    		text,
    		fab,
    		outlined,
    		rounded,
    		tile,
    		block,
    		xs,
    		sm,
    		lg,
    		xl,
    		textColor,
    		outlineColor,
    		bgColor,
    		$$scope,
    		slots,
    		click_handler
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			text: 3,
    			fab: 4,
    			outlined: 5,
    			rounded: 6,
    			tile: 7,
    			block: 8,
    			xs: 9,
    			sm: 10,
    			lg: 11,
    			xl: 12,
    			disabled: 0,
    			textColor: 13,
    			outlineColor: 14,
    			bgColor: 15
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fab() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fab(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlined() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rounded() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rounded(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tile() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tile(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get block() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xs() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xs(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sm() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sm(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lg() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lg(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xl() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xl(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textColor() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textColor(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlineColor() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlineColor(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svetamat/src/widgets/Spinner.svelte generated by Svelte v3.59.2 */

    const file$4 = "node_modules/svetamat/src/widgets/Spinner.svelte";

    function create_fragment$4(ctx) {
    	let svg;
    	let circle;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			attr_dev(circle, "class", "path svelte-1l2jm2f");
    			attr_dev(circle, "cx", "25");
    			attr_dev(circle, "cy", "25");
    			attr_dev(circle, "r", "20");
    			attr_dev(circle, "fill", "none");
    			attr_dev(circle, "stroke-width", "5");
    			add_location(circle, file$4, 39, 2, 664);
    			attr_dev(svg, "class", svg_class_value = "spinner stroke-current " + /*color*/ ctx[0] + " " + /*width*/ ctx[1] + " " + /*height*/ ctx[2] + " svelte-1l2jm2f");
    			attr_dev(svg, "viewBox", "0 0 50 50");
    			add_location(svg, file$4, 38, 0, 579);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color, width, height*/ 7 && svg_class_value !== (svg_class_value = "spinner stroke-current " + /*color*/ ctx[0] + " " + /*width*/ ctx[1] + " " + /*height*/ ctx[2] + " svelte-1l2jm2f")) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Spinner', slots, []);
    	let { color = 'text-purple-500' } = $$props;
    	let { width = 'w-8' } = $$props;
    	let { height = 'h-8' } = $$props;
    	const writable_props = ['color', 'width', 'height'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Spinner> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('width' in $$props) $$invalidate(1, width = $$props.width);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    	};

    	$$self.$capture_state = () => ({ color, width, height });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('width' in $$props) $$invalidate(1, width = $$props.width);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, width, height];
    }

    class Spinner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { color: 0, width: 1, height: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Spinner",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get color() {
    		throw new Error("<Spinner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Spinner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Spinner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Spinner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Spinner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Spinner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svetamat/src/widgets/Checkbox.svelte generated by Svelte v3.59.2 */
    const file$3 = "node_modules/svetamat/src/widgets/Checkbox.svelte";

    // (37:6) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("check_box_outline_blank");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(37:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (35:30) 
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("indeterminate_check_box");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(35:30) ",
    		ctx
    	});

    	return block;
    }

    // (33:6) {#if checked}
    function create_if_block_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("check_box");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(33:6) {#if checked}",
    		ctx
    	});

    	return block;
    }

    // (44:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 128)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[7],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[7])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(44:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (42:2) {#if label}
    function create_if_block$1(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*label*/ ctx[2]);
    			add_location(span, file$3, 42, 4, 1055);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(42:2) {#if label}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let label_1;
    	let input;
    	let t0;
    	let div;
    	let span;
    	let t1;
    	let current_block_type_index;
    	let if_block1;
    	let label_1_class_value;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*checked*/ ctx[0]) return create_if_block_1$1;
    		if (/*indeterminate*/ ctx[1]) return create_if_block_2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*label*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			input = element("input");
    			t0 = space();
    			div = element("div");
    			span = element("span");
    			if_block0.c();
    			t1 = space();
    			if_block1.c();
    			attr_dev(input, "type", "checkbox");
    			input.disabled = /*disabled*/ ctx[4];
    			input.hidden = true;
    			add_location(input, file$3, 27, 2, 607);
    			attr_dev(span, "class", "material-icons");
    			add_location(span, file$3, 31, 4, 827);
    			attr_dev(div, "class", "select-none rounded-full hover:bg-gray-300 w-8 h-8 flex items-center justify-center");
    			add_location(div, file$3, 29, 2, 721);
    			attr_dev(label_1, "class", label_1_class_value = "flex items-center float-left " + /*color*/ ctx[3]);
    			attr_dev(label_1, "disabled", /*disabled*/ ctx[4]);
    			toggle_class(label_1, "cursor-not-allowed", /*disabled*/ ctx[4]);
    			toggle_class(label_1, "cursor-pointer", !/*disabled*/ ctx[4]);
    			add_location(label_1, file$3, 25, 0, 465);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, input);
    			input.checked = /*checked*/ ctx[0];
    			append_dev(label_1, t0);
    			append_dev(label_1, div);
    			append_dev(div, span);
    			if_block0.m(span, null);
    			append_dev(label_1, t1);
    			if_blocks[current_block_type_index].m(label_1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[9]),
    					listen_dev(input, "change", /*handleChange*/ ctx[5], false, false, false, false),
    					listen_dev(input, "input", /*handleInput*/ ctx[6], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*disabled*/ 16) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[4]);
    			}

    			if (dirty & /*checked*/ 1) {
    				input.checked = /*checked*/ ctx[0];
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(span, null);
    				}
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(label_1, null);
    			}

    			if (!current || dirty & /*color*/ 8 && label_1_class_value !== (label_1_class_value = "flex items-center float-left " + /*color*/ ctx[3])) {
    				attr_dev(label_1, "class", label_1_class_value);
    			}

    			if (!current || dirty & /*disabled*/ 16) {
    				attr_dev(label_1, "disabled", /*disabled*/ ctx[4]);
    			}

    			if (!current || dirty & /*color, disabled*/ 24) {
    				toggle_class(label_1, "cursor-not-allowed", /*disabled*/ ctx[4]);
    			}

    			if (!current || dirty & /*color, disabled*/ 24) {
    				toggle_class(label_1, "cursor-pointer", !/*disabled*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    			if_block0.d();
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Checkbox', slots, ['default']);
    	const dispatch = createEventDispatcher();
    	let { label = '' } = $$props;
    	let { checked = false } = $$props;
    	let { indeterminate = false } = $$props;
    	let { color = 'text-black' } = $$props;
    	let { disabled = false } = $$props;

    	function handleChange(e) {
    		$$invalidate(1, indeterminate = false);
    		dispatch('change', e.target.checked);
    	}

    	function handleInput(e) {
    		$$invalidate(1, indeterminate = false);
    		dispatch('input', e.target.checked);
    	}

    	const writable_props = ['label', 'checked', 'indeterminate', 'color', 'disabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Checkbox> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		checked = this.checked;
    		$$invalidate(0, checked);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('checked' in $$props) $$invalidate(0, checked = $$props.checked);
    		if ('indeterminate' in $$props) $$invalidate(1, indeterminate = $$props.indeterminate);
    		if ('color' in $$props) $$invalidate(3, color = $$props.color);
    		if ('disabled' in $$props) $$invalidate(4, disabled = $$props.disabled);
    		if ('$$scope' in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		label,
    		checked,
    		indeterminate,
    		color,
    		disabled,
    		handleChange,
    		handleInput
    	});

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('checked' in $$props) $$invalidate(0, checked = $$props.checked);
    		if ('indeterminate' in $$props) $$invalidate(1, indeterminate = $$props.indeterminate);
    		if ('color' in $$props) $$invalidate(3, color = $$props.color);
    		if ('disabled' in $$props) $$invalidate(4, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		checked,
    		indeterminate,
    		label,
    		color,
    		disabled,
    		handleChange,
    		handleInput,
    		$$scope,
    		slots,
    		input_change_handler
    	];
    }

    class Checkbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			label: 2,
    			checked: 0,
    			indeterminate: 1,
    			color: 3,
    			disabled: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Checkbox",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get label() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get indeterminate() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set indeterminate(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var __assign$1 = (undefined && undefined.__assign) || function () {
        __assign$1 = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign$1.apply(this, arguments);
    };
    var __spreadArray$2 = (undefined && undefined.__spreadArray) || function (to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    };
    var mix = function (one, two, mergeArrays) {
        if (mergeArrays === void 0) { mergeArrays = false; }
        if (!one || !two || typeof one !== "object" || typeof two !== "object")
            return one;
        var clone = __assign$1({}, one);
        for (var prop in two) {
            if (two.hasOwnProperty(prop)) {
                if (two[prop] instanceof Array && one[prop] instanceof Array) {
                    clone[prop] = mergeArrays ? __spreadArray$2(__spreadArray$2([], one[prop], true), two[prop], true) : two[prop];
                }
                else if (typeof two[prop] === "object" && typeof one[prop] === "object") {
                    clone[prop] = mix(one[prop], two[prop], mergeArrays);
                }
                else {
                    clone[prop] = two[prop];
                }
            }
        }
        return clone;
    };

    var __spreadArray$1 = (undefined && undefined.__spreadArray) || function (to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    };
    var config = {
        // Default options
        defaults: {},
        // Error type
        errorType: null,
        // Polyfills
        polyfills: {
            fetch: null,
            FormData: null,
            URLSearchParams: null,
            performance: null,
            PerformanceObserver: null,
            AbortController: null
        },
        polyfill: function (p, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.doThrow, doThrow = _c === void 0 ? true : _c, _d = _b.instance, instance = _d === void 0 ? false : _d;
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var res = this.polyfills[p] ||
                (typeof self !== "undefined" ? self[p] : null) ||
                (typeof global !== "undefined" ? global[p] : null);
            if (doThrow && !res)
                throw new Error(p + " is not defined");
            return instance && res ? new (res.bind.apply(res, __spreadArray$1([void 0], args, false)))() : res;
        }
    };

    var onMatch = function (entries, name, callback, _performance) {
        if (!entries.getEntriesByName)
            return false;
        var matches = entries.getEntriesByName(name);
        if (matches && matches.length > 0) {
            callback(matches.reverse()[0]);
            if (_performance.clearMeasures)
                _performance.clearMeasures(name);
            perfs.callbacks.delete(name);
            if (perfs.callbacks.size < 1) {
                perfs.observer.disconnect();
                if (_performance.clearResourceTimings) {
                    _performance.clearResourceTimings();
                }
            }
            return true;
        }
        return false;
    };
    var lazyObserver = function (_performance, _observer) {
        if (!perfs.observer && _performance && _observer) {
            perfs.observer = new _observer(function (entries) {
                perfs.callbacks.forEach(function (callback, name) {
                    onMatch(entries, name, callback, _performance);
                });
            });
            if (_performance.clearResourceTimings)
                _performance.clearResourceTimings();
        }
        return perfs.observer;
    };
    var perfs = {
        callbacks: new Map(),
        observer: null,
        observe: function (name, callback) {
            if (!name || !callback)
                return;
            var _performance = config.polyfill("performance", { doThrow: false });
            var _observer = config.polyfill("PerformanceObserver", { doThrow: false });
            if (!lazyObserver(_performance, _observer))
                return;
            if (!onMatch(_performance, name, callback, _performance)) {
                if (perfs.callbacks.size < 1)
                    perfs.observer.observe({ entryTypes: ["resource", "measure"] });
                perfs.callbacks.set(name, callback);
            }
        }
    };

    var middlewareHelper = function (middlewares) { return function (fetchFunction) {
        return (middlewares.length === 0 ?
            fetchFunction :
            middlewares.length === 1 ?
                middlewares[0](fetchFunction) :
                middlewares.reduceRight(function (acc, curr, idx) {
                    return (idx === middlewares.length - 2) ? curr(acc(fetchFunction)) : curr(acc);
                }));
    }; };

    var WretchErrorWrapper = /** @class */ (function () {
        function WretchErrorWrapper(error) {
            this.error = error;
        }
        return WretchErrorWrapper;
    }());
    var resolver = function (wretcher) {
        var url = wretcher._url, _catchers = wretcher._catchers, resolvers = wretcher._resolvers, middlewares = wretcher._middlewares, opts = wretcher._options;
        var catchers = new Map(_catchers);
        var finalOptions = mix(config.defaults, opts);
        var fetchController = config.polyfill("AbortController", { doThrow: false, instance: true });
        if (!finalOptions["signal"] && fetchController) {
            finalOptions["signal"] = fetchController.signal;
        }
        // Request timeout
        var timeout = {
            ref: null,
            clear: function () {
                if (timeout.ref) {
                    clearTimeout(timeout.ref);
                    timeout.ref = null;
                }
            }
        };
        // The generated fetch request
        var fetchRequest = middlewareHelper(middlewares)(config.polyfill("fetch"))(url, finalOptions);
        // Throws on an http error
        var throwingPromise = fetchRequest
            .catch(function (error) {
            throw new WretchErrorWrapper(error);
        })
            .then(function (response) {
            timeout.clear();
            if (!response.ok) {
                if (response.type === "opaque") {
                    var err = new Error("Opaque response");
                    err["status"] = response.status;
                    err["response"] = response;
                    throw err;
                }
                return response[config.errorType || "text"]().then(function (msg) {
                    // Enhances the error object
                    var err = new Error(msg);
                    err[config.errorType || "text"] = msg;
                    err["status"] = response.status;
                    err["response"] = response;
                    throw err;
                });
            }
            return response;
        });
        // Wraps the Promise in order to dispatch the error to a matching catcher
        var catchersWrapper = function (promise) {
            return promise.catch(function (err) {
                timeout.clear();
                var error = err instanceof WretchErrorWrapper ? err.error : err;
                if (err instanceof WretchErrorWrapper && catchers.has("__fromFetch"))
                    return catchers.get("__fromFetch")(error, wretcher);
                else if (catchers.has(error.status))
                    return catchers.get(error.status)(error, wretcher);
                else if (catchers.has(error.name))
                    return catchers.get(error.name)(error, wretcher);
                else
                    throw error;
            });
        };
        var bodyParser = function (funName) { return function (cb) { return funName ?
            // If a callback is provided, then callback with the body result otherwise return the parsed body itself.
            catchersWrapper(throwingPromise.then(function (_) { return _ && _[funName](); }).then(function (_) { return cb ? cb(_) : _; })) :
            // No body parsing method - return the response
            catchersWrapper(throwingPromise.then(function (_) { return cb ? cb(_) : _; })); }; };
        var responseChain = {
            /**
             * Retrieves the raw result as a promise.
             */
            res: bodyParser(null),
            /**
             * Retrieves the result as a parsed JSON object.
             */
            json: bodyParser("json"),
            /**
             * Retrieves the result as a Blob object.
             */
            blob: bodyParser("blob"),
            /**
             * Retrieves the result as a FormData object.
             */
            formData: bodyParser("formData"),
            /**
             * Retrieves the result as an ArrayBuffer object.
             */
            arrayBuffer: bodyParser("arrayBuffer"),
            /**
             * Retrieves the result as a string.
             */
            text: bodyParser("text"),
            /**
             * Performs a callback on the API performance timings of the request.
             *
             * Warning: Still experimental on browsers and node.js
             */
            perfs: function (cb) {
                fetchRequest.then(function (res) { return perfs.observe(res.url, cb); }).catch(function () { });
                return responseChain;
            },
            /**
             * Aborts the request after a fixed time.
             *
             * @param time Time in milliseconds
             * @param controller A custom controller
             */
            setTimeout: function (time, controller) {
                if (controller === void 0) { controller = fetchController; }
                timeout.clear();
                timeout.ref = setTimeout(function () { return controller.abort(); }, time);
                return responseChain;
            },
            /**
             * Returns the automatically generated AbortController alongside the current wretch response as a pair.
             */
            controller: function () { return [fetchController, responseChain]; },
            /**
             * Catches an http response with a specific error code or name and performs a callback.
             */
            error: function (errorId, cb) {
                catchers.set(errorId, cb);
                return responseChain;
            },
            /**
             * Catches a bad request (http code 400) and performs a callback.
             */
            badRequest: function (cb) { return responseChain.error(400, cb); },
            /**
             * Catches an unauthorized request (http code 401) and performs a callback.
             */
            unauthorized: function (cb) { return responseChain.error(401, cb); },
            /**
             * Catches a forbidden request (http code 403) and performs a callback.
             */
            forbidden: function (cb) { return responseChain.error(403, cb); },
            /**
             * Catches a "not found" request (http code 404) and performs a callback.
             */
            notFound: function (cb) { return responseChain.error(404, cb); },
            /**
             * Catches a timeout (http code 408) and performs a callback.
             */
            timeout: function (cb) { return responseChain.error(408, cb); },
            /**
             * Catches an internal server error (http code 500) and performs a callback.
             */
            internalError: function (cb) { return responseChain.error(500, cb); },
            /**
             * Catches errors thrown when calling the fetch function and performs a callback.
             */
            fetchError: function (cb) { return responseChain.error("__fromFetch", cb); },
            /**
             * Catches an AbortError and performs a callback.
             */
            onAbort: function (cb) { return responseChain.error("AbortError", cb); }
        };
        return resolvers.reduce(function (chain, r) { return r(chain, wretcher); }, responseChain);
    };

    var __assign = (undefined && undefined.__assign) || function () {
        __assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    };
    var JSON_MIME = "application/json";
    var CONTENT_TYPE_HEADER = "Content-Type";
    function extractContentType(headers) {
        var _a;
        if (headers === void 0) { headers = {}; }
        return (_a = Object.entries(headers).find(function (_a) {
            var k = _a[0];
            return k.toLowerCase() === CONTENT_TYPE_HEADER.toLowerCase();
        })) === null || _a === void 0 ? void 0 : _a[1];
    }
    function isLikelyJsonMime(value) {
        return /^application\/.*json.*/.test(value);
    }
    /**
     * The Wretcher class used to perform easy fetch requests.
     *
     * Immutability : almost every method of this class return a fresh Wretcher object.
     */
    var Wretcher = /** @class */ (function () {
        function Wretcher(_url, _options, _catchers, _resolvers, _middlewares, _deferredChain) {
            if (_catchers === void 0) { _catchers = new Map(); }
            if (_resolvers === void 0) { _resolvers = []; }
            if (_middlewares === void 0) { _middlewares = []; }
            if (_deferredChain === void 0) { _deferredChain = []; }
            this._url = _url;
            this._options = _options;
            this._catchers = _catchers;
            this._resolvers = _resolvers;
            this._middlewares = _middlewares;
            this._deferredChain = _deferredChain;
        }
        Wretcher.factory = function (url, options) {
            if (url === void 0) { url = ""; }
            if (options === void 0) { options = {}; }
            return new Wretcher(url, options);
        };
        Wretcher.prototype.selfFactory = function (_a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.url, url = _c === void 0 ? this._url : _c, _d = _b.options, options = _d === void 0 ? this._options : _d, _e = _b.catchers, catchers = _e === void 0 ? this._catchers : _e, _f = _b.resolvers, resolvers = _f === void 0 ? this._resolvers : _f, _g = _b.middlewares, middlewares = _g === void 0 ? this._middlewares : _g, _h = _b.deferredChain, deferredChain = _h === void 0 ? this._deferredChain : _h;
            return new Wretcher(url, __assign({}, options), new Map(catchers), __spreadArray([], resolvers, true), __spreadArray([], middlewares, true), __spreadArray([], deferredChain, true));
        };
        /**
         * Sets the default fetch options used for every subsequent fetch call.
         * @param options New default options
         * @param mixin If true, mixes in instead of replacing the existing options
         */
        Wretcher.prototype.defaults = function (options, mixin) {
            if (mixin === void 0) { mixin = false; }
            config.defaults = mixin ? mix(config.defaults, options) : options;
            return this;
        };
        /**
         * Sets the method (text, json ...) used to parse the data contained in the response body in case of an HTTP error.
         *
         * Persists for every subsequent requests.
         *
         * Default is "text".
         */
        Wretcher.prototype.errorType = function (method) {
            config.errorType = method;
            return this;
        };
        /**
         * Sets the non-global polyfills which will be used for every subsequent calls.
         *
         * Needed for libraries like [fetch-ponyfill](https://github.com/qubyte/fetch-ponyfill).
         *
         * @param polyfills An object containing the polyfills.
         */
        Wretcher.prototype.polyfills = function (polyfills) {
            config.polyfills = __assign(__assign({}, config.polyfills), polyfills);
            return this;
        };
        /**
         * Returns a new Wretcher object with the argument url appended and the same options.
         * @param url String url
         * @param replace Boolean If true, replaces the current url instead of appending
         */
        Wretcher.prototype.url = function (url, replace) {
            if (replace === void 0) { replace = false; }
            if (replace)
                return this.selfFactory({ url: url });
            var split = this._url.split("?");
            return this.selfFactory({
                url: split.length > 1 ?
                    split[0] + url + "?" + split[1] :
                    this._url + url
            });
        };
        /**
         * Returns a new Wretcher object with the same url and new options.
         * @param options New options
         * @param mixin If true, mixes in instead of replacing the existing options
         */
        Wretcher.prototype.options = function (options, mixin) {
            if (mixin === void 0) { mixin = true; }
            return this.selfFactory({ options: mixin ? mix(this._options, options) : options });
        };
        /**
         * Converts a javascript object to query parameters,
         * then appends this query string to the current url.
         *
         * If given a string, use the string as the query verbatim.
         *
         * ```
         * let w = wretch("http://example.com") // url is http://example.com
         *
         * // Chain query calls
         * w = w.query({ a: 1, b : 2 }) // url is now http://example.com?a=1&b=2
         * w = w.query("foo-bar-baz-woz") // url is now http://example.com?a=1&b=2&foo-bar-baz-woz
         *
         * // Pass true as the second argument to replace existing query parameters
         * w = w.query("c=3&d=4", true) // url is now http://example.com?c=3&d=4
         * ```
         *
         * @param qp An object which will be converted, or a string which will be used verbatim.
         */
        Wretcher.prototype.query = function (qp, replace) {
            if (replace === void 0) { replace = false; }
            return this.selfFactory({ url: appendQueryParams(this._url, qp, replace) });
        };
        /**
         * Set request headers.
         * @param headerValues An object containing header keys and values
         */
        Wretcher.prototype.headers = function (headerValues) {
            return this.selfFactory({ options: mix(this._options, { headers: headerValues || {} }) });
        };
        /**
         * Shortcut to set the "Accept" header.
         * @param headerValue Header value
         */
        Wretcher.prototype.accept = function (headerValue) {
            return this.headers({ Accept: headerValue });
        };
        /**
         * Shortcut to set the "Content-Type" header.
         * @param headerValue Header value
         */
        Wretcher.prototype.content = function (headerValue) {
            var _a;
            return this.headers((_a = {}, _a[CONTENT_TYPE_HEADER] = headerValue, _a));
        };
        /**
         * Shortcut to set the "Authorization" header.
         * @param headerValue Header value
         */
        Wretcher.prototype.auth = function (headerValue) {
            return this.headers({ Authorization: headerValue });
        };
        /**
         * Adds a default catcher which will be called on every subsequent request error when the error code matches.
         * @param errorId Error code or name
         * @param catcher: The catcher method
         */
        Wretcher.prototype.catcher = function (errorId, catcher) {
            var newMap = new Map(this._catchers);
            newMap.set(errorId, catcher);
            return this.selfFactory({ catchers: newMap });
        };
        /**
         * Associates a custom signal with the request.
         * @param controller : An AbortController
         */
        Wretcher.prototype.signal = function (controller) {
            return this.selfFactory({ options: __assign(__assign({}, this._options), { signal: controller.signal }) });
        };
        /**
         * Program a resolver to perform response chain tasks automatically.
         * @param doResolve : Resolver callback
         */
        Wretcher.prototype.resolve = function (doResolve, clear) {
            if (clear === void 0) { clear = false; }
            return this.selfFactory({ resolvers: clear ? [doResolve] : __spreadArray(__spreadArray([], this._resolvers, true), [doResolve], false) });
        };
        /**
         * Defer wretcher methods that will be chained and called just before the request is performed.
         */
        Wretcher.prototype.defer = function (callback, clear) {
            if (clear === void 0) { clear = false; }
            return this.selfFactory({
                deferredChain: clear ? [callback] : __spreadArray(__spreadArray([], this._deferredChain, true), [callback], false)
            });
        };
        /**
         * Add middlewares to intercept a request before being sent.
         */
        Wretcher.prototype.middlewares = function (middlewares, clear) {
            if (clear === void 0) { clear = false; }
            return this.selfFactory({
                middlewares: clear ? middlewares : __spreadArray(__spreadArray([], this._middlewares, true), middlewares, true)
            });
        };
        Wretcher.prototype.method = function (method, options, body) {
            if (options === void 0) { options = {}; }
            if (body === void 0) { body = null; }
            var base = this.options(__assign(__assign({}, options), { method: method }));
            // "Jsonify" the body if it is an object and if it is likely that the content type targets json.
            var contentType = extractContentType(base._options.headers);
            var jsonify = typeof body === "object" && (!base._options.headers || !contentType || isLikelyJsonMime(contentType));
            base =
                !body ? base :
                    jsonify ? base.json(body, contentType) :
                        base.body(body);
            return resolver(base
                ._deferredChain
                .reduce(function (acc, curr) { return curr(acc, acc._url, acc._options); }, base));
        };
        /**
         * Performs a get request.
         */
        Wretcher.prototype.get = function (options) {
            return this.method("GET", options);
        };
        /**
         * Performs a delete request.
         */
        Wretcher.prototype.delete = function (options) {
            return this.method("DELETE", options);
        };
        /**
         * Performs a put request.
         */
        Wretcher.prototype.put = function (body, options) {
            return this.method("PUT", options, body);
        };
        /**
         * Performs a post request.
         */
        Wretcher.prototype.post = function (body, options) {
            return this.method("POST", options, body);
        };
        /**
         * Performs a patch request.
         */
        Wretcher.prototype.patch = function (body, options) {
            return this.method("PATCH", options, body);
        };
        /**
         * Performs a head request.
         */
        Wretcher.prototype.head = function (options) {
            return this.method("HEAD", options);
        };
        /**
         * Performs an options request
         */
        Wretcher.prototype.opts = function (options) {
            return this.method("OPTIONS", options);
        };
        /**
         * Replay a request.
         */
        Wretcher.prototype.replay = function (options) {
            return this.method(this._options.method, options);
        };
        /**
         * Sets the request body with any content.
         * @param contents The body contents
         */
        Wretcher.prototype.body = function (contents) {
            return this.selfFactory({ options: __assign(__assign({}, this._options), { body: contents }) });
        };
        /**
         * Sets the content type header, stringifies an object and sets the request body.
         * @param jsObject An object which will be serialized into a JSON
         * @param contentType A custom content type.
         */
        Wretcher.prototype.json = function (jsObject, contentType) {
            var currentContentType = extractContentType(this._options.headers);
            return this.content(contentType ||
                isLikelyJsonMime(currentContentType) && currentContentType ||
                JSON_MIME).body(JSON.stringify(jsObject));
        };
        /**
         * Converts the javascript object to a FormData and sets the request body.
         * @param formObject An object which will be converted to a FormData
         * @param recursive If `true`, will recurse through all nested objects
         * Can be set as an array of string to exclude specific keys.
         * See https://github.com/elbywan/wretch/issues/68 for more details.
         */
        Wretcher.prototype.formData = function (formObject, recursive) {
            if (recursive === void 0) { recursive = false; }
            return this.body(convertFormData(formObject, recursive));
        };
        /**
         * Converts the input to an url encoded string and sets the content-type header and body.
         * If the input argument is already a string, skips the conversion part.
         *
         * @param input An object to convert into an url encoded string or an already encoded string
         */
        Wretcher.prototype.formUrl = function (input) {
            return this
                .body(typeof input === "string" ? input : convertFormUrl(input))
                .content("application/x-www-form-urlencoded");
        };
        return Wretcher;
    }());
    // Internal helpers
    var appendQueryParams = function (url, qp, replace) {
        var queryString;
        if (typeof qp === "string") {
            queryString = qp;
        }
        else {
            var usp = config.polyfill("URLSearchParams", { instance: true });
            for (var key in qp) {
                if (qp[key] instanceof Array) {
                    for (var _i = 0, _a = qp[key]; _i < _a.length; _i++) {
                        var val = _a[_i];
                        usp.append(key, val);
                    }
                }
                else {
                    usp.append(key, qp[key]);
                }
            }
            queryString = usp.toString();
        }
        var split = url.split("?");
        if (!queryString)
            return replace ? split[0] : url;
        if (replace || split.length < 2)
            return split[0] + "?" + queryString;
        return url + "&" + queryString;
    };
    function convertFormData(formObject, recursive, formData, ancestors) {
        if (recursive === void 0) { recursive = false; }
        if (formData === void 0) { formData = config.polyfill("FormData", { instance: true }); }
        if (ancestors === void 0) { ancestors = []; }
        Object.entries(formObject).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            var formKey = ancestors.reduce(function (acc, ancestor) { return (acc ? "".concat(acc, "[").concat(ancestor, "]") : ancestor); }, null);
            formKey = formKey ? "".concat(formKey, "[").concat(key, "]") : key;
            if (value instanceof Array) {
                for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
                    var item = value_1[_i];
                    formData.append(formKey + "[]", item);
                }
            }
            else if (recursive &&
                typeof value === "object" &&
                (!(recursive instanceof Array) ||
                    !recursive.includes(key))) {
                if (value !== null) {
                    convertFormData(value, recursive, formData, __spreadArray(__spreadArray([], ancestors, true), [key], false));
                }
            }
            else {
                formData.append(formKey, value);
            }
        });
        return formData;
    }
    function encodeQueryValue(key, value) {
        return encodeURIComponent(key) +
            "=" +
            encodeURIComponent(typeof value === "object" ?
                JSON.stringify(value) :
                "" + value);
    }
    function convertFormUrl(formObject) {
        return Object.keys(formObject)
            .map(function (key) {
            var value = formObject[key];
            if (value instanceof Array) {
                return value.map(function (v) { return encodeQueryValue(key, v); }).join("&");
            }
            return encodeQueryValue(key, value);
        })
            .join("&");
    }

    var factory = Wretcher.factory;
    factory["default"] = Wretcher.factory;

    function calculateDraws({ winners, runnerups }) {
      return factory(`/api/draw/winners/${winners}/runnerups/${runnerups}`)
        .get()
        .json()
    }

    /* src/components/SplitDraw.svelte generated by Svelte v3.59.2 */

    const file$2 = "src/components/SplitDraw.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_4$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (170:20) {#each group as player}
    function create_each_block_4$1(ctx) {
    	let div;
    	let span0;
    	let t0_value = /*player*/ ctx[18].pos + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*player*/ ctx[18].label + "";
    	let t2;
    	let span1_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			attr_dev(span0, "class", "pos svelte-1p1nva3");
    			add_location(span0, file$2, 171, 24, 4056);

    			attr_dev(span1, "class", span1_class_value = "name " + (/*player*/ ctx[18].isBye
    			? 'bye'
    			: /*player*/ ctx[18].isWinner
    				? 'winner'
    				: /*player*/ ctx[18].isRunnerUp ? 'runner-up' : '') + " svelte-1p1nva3");

    			add_location(span1, file$2, 172, 24, 4118);
    			attr_dev(div, "class", "player svelte-1p1nva3");
    			add_location(div, file$2, 170, 22, 4011);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(div, t1);
    			append_dev(div, span1);
    			append_dev(span1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*columns*/ 1 && t0_value !== (t0_value = /*player*/ ctx[18].pos + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*columns*/ 1 && t2_value !== (t2_value = /*player*/ ctx[18].label + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*columns*/ 1 && span1_class_value !== (span1_class_value = "name " + (/*player*/ ctx[18].isBye
    			? 'bye'
    			: /*player*/ ctx[18].isWinner
    				? 'winner'
    				: /*player*/ ctx[18].isRunnerUp ? 'runner-up' : '') + " svelte-1p1nva3")) {
    				attr_dev(span1, "class", span1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4$1.name,
    		type: "each",
    		source: "(170:20) {#each group as player}",
    		ctx
    	});

    	return block;
    }

    // (168:16) {#each eighth as group}
    function create_each_block_3$1(ctx) {
    	let div;
    	let each_value_4 = /*group*/ ctx[15];
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4$1(get_each_context_4$1(ctx, each_value_4, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "group svelte-1p1nva3");
    			add_location(div, file$2, 168, 18, 3925);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*columns*/ 1) {
    				each_value_4 = /*group*/ ctx[15];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4$1(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$1.name,
    		type: "each",
    		source: "(168:16) {#each eighth as group}",
    		ctx
    	});

    	return block;
    }

    // (166:12) {#each quarter as eighth}
    function create_each_block_2$1(ctx) {
    	let div;
    	let each_value_3 = /*eighth*/ ctx[12];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "eighth svelte-1p1nva3");
    			add_location(div, file$2, 166, 14, 3846);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*columns*/ 1) {
    				each_value_3 = /*eighth*/ ctx[12];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(166:12) {#each quarter as eighth}",
    		ctx
    	});

    	return block;
    }

    // (164:8) {#each column.quarters as quarter}
    function create_each_block_1$1(ctx) {
    	let div;
    	let t;
    	let each_value_2 = /*quarter*/ ctx[9];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "quarter svelte-1p1nva3");
    			add_location(div, file$2, 164, 10, 3772);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*columns*/ 1) {
    				each_value_2 = /*quarter*/ ctx[9];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(164:8) {#each column.quarters as quarter}",
    		ctx
    	});

    	return block;
    }

    // (160:2) {#each columns as column}
    function create_each_block$1(ctx) {
    	let div2;
    	let div0;
    	let t0_value = /*column*/ ctx[6].label + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let each_value_1 = /*column*/ ctx[6].quarters;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(div0, "class", "column-label svelte-1p1nva3");
    			add_location(div0, file$2, 161, 6, 3640);
    			attr_dev(div1, "class", "column-body svelte-1p1nva3");
    			add_location(div1, file$2, 162, 6, 3693);
    			attr_dev(div2, "class", "column svelte-1p1nva3");
    			add_location(div2, file$2, 160, 4, 3613);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			append_dev(div2, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*columns*/ 1 && t0_value !== (t0_value = /*column*/ ctx[6].label + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*columns*/ 1) {
    				each_value_1 = /*column*/ ctx[6].quarters;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(160:2) {#each columns as column}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let each_value = /*columns*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "columns-container svelte-1p1nva3");
    			add_location(div, file$2, 158, 0, 3549);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*columns*/ 1) {
    				each_value = /*columns*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function extractLabel(playerStr, pos) {
    	if (!playerStr || playerStr === `${pos}`) return `${pos}`;
    	return playerStr.replace(`${pos}: `, '');
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let columnCount;
    	let positionsPerColumn;
    	let columns;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SplitDraw', slots, []);
    	let { round = 1 } = $$props;
    	let { players = [] } = $$props;

    	function getColumns(round, players, columnCount, positionsPerColumn) {
    		const columns = [];

    		for (let c = 0; c < columnCount; c++) {
    			const startPos = c * positionsPerColumn + 1;
    			const quarters = [];
    			const quarterCount = positionsPerColumn / 16;

    			for (let q = 0; q < quarterCount; q++) {
    				const quarterStart = startPos + q * 16;
    				const eighths = [];

    				for (let e = 0; e < 2; e++) {
    					const eighthStart = quarterStart + e * 8;
    					const groups = [];

    					for (let g = 0; g < 2; g++) {
    						const groupStart = eighthStart + g * 4;
    						const groupPlayers = [];

    						for (let p = 0; p < 4; p++) {
    							const pos = groupStart + p;
    							const raw = players[pos - 1] || `${pos}`;

    							groupPlayers.push({
    								pos,
    								label: extractLabel(raw, pos),
    								isBye: raw.toUpperCase().includes('BYE'),
    								isWinner: raw.toLowerCase().includes('winner'),
    								isRunnerUp: raw.toLowerCase().includes('runner-up')
    							});
    						}

    						groups.push(groupPlayers);
    					}

    					eighths.push(groups);
    				}

    				quarters.push(eighths);
    			}

    			columns.push({
    				label: columnCount === 2
    				? c === 0 ? 'TOP HALF' : 'BOTTOM HALF'
    				: `QUARTER ${c + 1}`,
    				quarters
    			});
    		}

    		return columns;
    	}

    	const writable_props = ['round', 'players'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SplitDraw> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('round' in $$props) $$invalidate(1, round = $$props.round);
    		if ('players' in $$props) $$invalidate(2, players = $$props.players);
    	};

    	$$self.$capture_state = () => ({
    		round,
    		players,
    		extractLabel,
    		getColumns,
    		positionsPerColumn,
    		columnCount,
    		columns
    	});

    	$$self.$inject_state = $$props => {
    		if ('round' in $$props) $$invalidate(1, round = $$props.round);
    		if ('players' in $$props) $$invalidate(2, players = $$props.players);
    		if ('positionsPerColumn' in $$props) $$invalidate(3, positionsPerColumn = $$props.positionsPerColumn);
    		if ('columnCount' in $$props) $$invalidate(4, columnCount = $$props.columnCount);
    		if ('columns' in $$props) $$invalidate(0, columns = $$props.columns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*round*/ 2) {
    			$$invalidate(4, columnCount = round <= 64 ? 2 : 4);
    		}

    		if ($$self.$$.dirty & /*round, columnCount*/ 18) {
    			$$invalidate(3, positionsPerColumn = round / columnCount);
    		}

    		if ($$self.$$.dirty & /*round, players, columnCount, positionsPerColumn*/ 30) {
    			$$invalidate(0, columns = getColumns(round, players, columnCount, positionsPerColumn));
    		}
    	};

    	return [columns, round, players, positionsPerColumn, columnCount];
    }

    class SplitDraw extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { round: 1, players: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SplitDraw",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get round() {
    		throw new Error("<SplitDraw>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set round(value) {
    		throw new Error("<SplitDraw>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get players() {
    		throw new Error("<SplitDraw>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set players(value) {
    		throw new Error("<SplitDraw>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/Draw.svelte generated by Svelte v3.59.2 */
    const file$1 = "src/pages/Draw.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    // (96:4) <Button bgColor="bg-red-500" textColor="text-white" on:click={calculate}>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Calculate");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(96:4) <Button bgColor=\\\"bg-red-500\\\" textColor=\\\"text-white\\\" on:click={calculate}>",
    		ctx
    	});

    	return block;
    }

    // (162:2) {:catch e}
    function create_catch_block(ctx) {
    	let div1;
    	let span;
    	let t1;
    	let div0;
    	let t2_value = /*e*/ ctx[30].message + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "error";
    			t1 = space();
    			div0 = element("div");
    			t2 = text(t2_value);
    			attr_dev(span, "class", "material-icons text-red-500");
    			add_location(span, file$1, 164, 6, 5114);
    			attr_dev(div0, "class", "ml-4");
    			add_location(div0, file$1, 165, 6, 5175);
    			attr_dev(div1, "class", "rounded-lg mt-4 mx-2 p-4 elevation-3 bg-red-100 flex items-center");
    			add_location(div1, file$1, 162, 4, 5022);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*calculatePromise*/ 256 && t2_value !== (t2_value = /*e*/ ctx[30].message + "")) set_data_dev(t2, t2_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(162:2) {:catch e}",
    		ctx
    	});

    	return block;
    }

    // (106:2) {:then}
    function create_then_block(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*players*/ ctx[4].length > 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*players*/ ctx[4].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*players*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(106:2) {:then}",
    		ctx
    	});

    	return block;
    }

    // (107:4) {#if players.length > 0}
    function create_if_block(ctx) {
    	let div2;
    	let h20;
    	let t0;
    	let div0;
    	let checkbox;
    	let updating_checked;
    	let t1;
    	let div1;
    	let t2;
    	let t3;
    	let div4;
    	let h21;
    	let t5;
    	let div3;
    	let t6;
    	let div5;
    	let splitdraw;
    	let current;

    	function checkbox_checked_binding(value) {
    		/*checkbox_checked_binding*/ ctx[17](value);
    	}

    	let checkbox_props = {
    		label: "Ascending",
    		color: "text-orange-600"
    	};

    	if (/*sorted*/ ctx[0] !== void 0) {
    		checkbox_props.checked = /*sorted*/ ctx[0];
    	}

    	checkbox = new Checkbox({ props: checkbox_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox, 'checked', checkbox_checked_binding));
    	let each_value_4 = /*winnersGrpsOf4*/ ctx[5];
    	validate_each_argument(each_value_4);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_1[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	let if_block = /*runnerUpsGrpsOf4*/ ctx[6].length > 0 && create_if_block_1(ctx);
    	let each_value = /*byesGrpsOf4*/ ctx[7];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	splitdraw = new SplitDraw({
    			props: {
    				round: /*round*/ ctx[3],
    				players: /*players*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h20 = element("h2");
    			t0 = text("Winners' Positions\n          ");
    			div0 = element("div");
    			create_component(checkbox.$$.fragment);
    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			div4 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Byes' Positions";
    			t5 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			div5 = element("div");
    			create_component(splitdraw.$$.fragment);
    			attr_dev(div0, "class", "ml-6");
    			add_location(div0, file$1, 112, 10, 3271);
    			attr_dev(h20, "class", "sm:text-lg text-base font-medium mr-2 flex items-center justify-between");
    			add_location(h20, file$1, 108, 8, 3127);
    			attr_dev(div1, "class", "flex flex-wrap");
    			add_location(div1, file$1, 119, 8, 3460);
    			attr_dev(div2, "class", "rounded-lg mt-4 mx-2 py-4 px-4 elevation-3 bg-green-100");
    			add_location(div2, file$1, 107, 6, 3049);
    			attr_dev(h21, "class", "sm:text-lg text-base font-medium mb-2");
    			add_location(h21, file$1, 146, 8, 4417);
    			attr_dev(div3, "class", "flex flex-wrap");
    			add_location(div3, file$1, 147, 8, 4496);
    			attr_dev(div4, "class", "rounded-lg mt-2 mx-2 py-4 px-4 elevation-3 bg-gray-200");
    			add_location(div4, file$1, 145, 6, 4340);
    			attr_dev(div5, "class", "rounded-lg my-4 mx-2 py-4 px-4 overflow-x-auto");
    			set_style(div5, "background", "radial-gradient(circle at center, #233c2d 0%, #101c15 100%)");
    			add_location(div5, file$1, 157, 6, 4800);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h20);
    			append_dev(h20, t0);
    			append_dev(h20, div0);
    			mount_component(checkbox, div0, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div1, null);
    				}
    			}

    			insert_dev(target, t2, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h21);
    			append_dev(div4, t5);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div3, null);
    				}
    			}

    			insert_dev(target, t6, anchor);
    			insert_dev(target, div5, anchor);
    			mount_component(splitdraw, div5, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const checkbox_changes = {};

    			if (!updating_checked && dirty[0] & /*sorted*/ 1) {
    				updating_checked = true;
    				checkbox_changes.checked = /*sorted*/ ctx[0];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);

    			if (dirty[0] & /*winnersGrpsOf4*/ 32) {
    				each_value_4 = /*winnersGrpsOf4*/ ctx[5];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_4(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_4.length;
    			}

    			if (/*runnerUpsGrpsOf4*/ ctx[6].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(t3.parentNode, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*byesGrpsOf4*/ 128) {
    				each_value = /*byesGrpsOf4*/ ctx[7];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const splitdraw_changes = {};
    			if (dirty[0] & /*round*/ 8) splitdraw_changes.round = /*round*/ ctx[3];
    			if (dirty[0] & /*players*/ 16) splitdraw_changes.players = /*players*/ ctx[4];
    			splitdraw.$set(splitdraw_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(splitdraw.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(splitdraw.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(checkbox);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div5);
    			destroy_component(splitdraw);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(107:4) {#if players.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (123:14) {#each grp as pos}
    function create_each_block_5(ctx) {
    	let div;
    	let t_value = /*pos*/ ctx[21] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "w-12 text-right tracking-tight");
    			add_location(div, file$1, 123, 16, 3618);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*winnersGrpsOf4*/ 32 && t_value !== (t_value = /*pos*/ ctx[21] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(123:14) {#each grp as pos}",
    		ctx
    	});

    	return block;
    }

    // (121:10) {#each winnersGrpsOf4 as grp, i}
    function create_each_block_4(ctx) {
    	let div;
    	let t;
    	let each_value_5 = /*grp*/ ctx[18];
    	validate_each_argument(each_value_5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "mr-12 flex");
    			add_location(div, file$1, 121, 12, 3544);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*winnersGrpsOf4*/ 32) {
    				each_value_5 = /*grp*/ ctx[18];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_5.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(121:10) {#each winnersGrpsOf4 as grp, i}",
    		ctx
    	});

    	return block;
    }

    // (130:6) {#if runnerUpsGrpsOf4.length > 0}
    function create_if_block_1(ctx) {
    	let div1;
    	let h2;
    	let t1;
    	let div0;
    	let each_value_2 = /*runnerUpsGrpsOf4*/ ctx[6];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Runner-Ups' Positions";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "sm:text-lg text-base font-medium mb-2");
    			add_location(h2, file$1, 131, 10, 3890);
    			attr_dev(div0, "class", "flex flex-wrap");
    			add_location(div0, file$1, 134, 10, 4001);
    			attr_dev(div1, "class", "rounded-lg mt-2 mx-2 py-4 px-4 elevation-3 bg-orange-100");
    			add_location(div1, file$1, 130, 8, 3809);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*runnerUpsGrpsOf4*/ 64) {
    				each_value_2 = /*runnerUpsGrpsOf4*/ ctx[6];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(130:6) {#if runnerUpsGrpsOf4.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (138:16) {#each grp as pos}
    function create_each_block_3(ctx) {
    	let div;
    	let t_value = /*pos*/ ctx[21] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "w-12 text-right tracking-tight");
    			add_location(div, file$1, 138, 18, 4169);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*runnerUpsGrpsOf4*/ 64 && t_value !== (t_value = /*pos*/ ctx[21] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(138:16) {#each grp as pos}",
    		ctx
    	});

    	return block;
    }

    // (136:12) {#each runnerUpsGrpsOf4 as grp, i}
    function create_each_block_2(ctx) {
    	let div;
    	let t;
    	let each_value_3 = /*grp*/ ctx[18];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "mr-12 flex");
    			add_location(div, file$1, 136, 14, 4091);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*runnerUpsGrpsOf4*/ 64) {
    				each_value_3 = /*grp*/ ctx[18];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(136:12) {#each runnerUpsGrpsOf4 as grp, i}",
    		ctx
    	});

    	return block;
    }

    // (151:14) {#each grp as pos}
    function create_each_block_1(ctx) {
    	let div;
    	let t_value = /*pos*/ ctx[21] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "w-12 text-right tracking-tight");
    			add_location(div, file$1, 151, 16, 4651);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*byesGrpsOf4*/ 128 && t_value !== (t_value = /*pos*/ ctx[21] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(151:14) {#each grp as pos}",
    		ctx
    	});

    	return block;
    }

    // (149:10) {#each byesGrpsOf4 as grp, i}
    function create_each_block(ctx) {
    	let div;
    	let t;
    	let each_value_1 = /*grp*/ ctx[18];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "mr-12 flex");
    			add_location(div, file$1, 149, 12, 4577);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*byesGrpsOf4*/ 128) {
    				each_value_1 = /*grp*/ ctx[18];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(149:10) {#each byesGrpsOf4 as grp, i}",
    		ctx
    	});

    	return block;
    }

    // (100:27)      <div       class="rounded-lg mt-4 mx-2 p-4 elevation-3 bg-blue-100 flex items-center">       <Spinner />       <div class="ml-4">Calculation in progress...</div>     </div>   {:then}
    function create_pending_block(ctx) {
    	let div1;
    	let spinner;
    	let t0;
    	let div0;
    	let current;
    	spinner = new Spinner({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			create_component(spinner.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			div0.textContent = "Calculation in progress...";
    			attr_dev(div0, "class", "ml-4");
    			add_location(div0, file$1, 103, 6, 2942);
    			attr_dev(div1, "class", "rounded-lg mt-4 mx-2 p-4 elevation-3 bg-blue-100 flex items-center");
    			add_location(div1, file$1, 100, 4, 2831);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			mount_component(spinner, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spinner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spinner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(spinner);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(100:27)      <div       class=\\\"rounded-lg mt-4 mx-2 p-4 elevation-3 bg-blue-100 flex items-center\\\">       <Spinner />       <div class=\\\"ml-4\\\">Calculation in progress...</div>     </div>   {:then}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div4;
    	let div2;
    	let div0;
    	let input0;
    	let updating_value;
    	let t0;
    	let div1;
    	let input1;
    	let updating_value_1;
    	let t1;
    	let div3;
    	let button;
    	let t2;
    	let promise;
    	let current;

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[15](value);
    	}

    	let input0_props = {
    		number: true,
    		outlined: true,
    		label: "Total no. of winners"
    	};

    	if (/*winners*/ ctx[1] !== void 0) {
    		input0_props.value = /*winners*/ ctx[1];
    	}

    	input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, 'value', input0_value_binding));
    	input0.$on("keyup", /*calculate*/ ctx[9]);

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[16](value);
    	}

    	let input1_props = {
    		number: true,
    		outlined: true,
    		label: "Total no. of runner-ups"
    	};

    	if (/*runnerups*/ ctx[2] !== void 0) {
    		input1_props.value = /*runnerups*/ ctx[2];
    	}

    	input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, 'value', input1_value_binding));
    	input1.$on("keyup", /*calculate*/ ctx[9]);

    	button = new Button({
    			props: {
    				bgColor: "bg-red-500",
    				textColor: "text-white",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*calculate*/ ctx[9]);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		error: 30,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*calculatePromise*/ ctx[8], info);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			create_component(input0.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(input1.$$.fragment);
    			t1 = space();
    			div3 = element("div");
    			create_component(button.$$.fragment);
    			t2 = space();
    			info.block.c();
    			attr_dev(div0, "class", "w-1/2 mx-2");
    			add_location(div0, file$1, 77, 4, 2257);
    			attr_dev(div1, "class", "w-1/2 mx-2");
    			add_location(div1, file$1, 85, 4, 2440);
    			attr_dev(div2, "class", "flex justify-around items-center");
    			add_location(div2, file$1, 76, 2, 2206);
    			attr_dev(div3, "class", "flex flex-row-reverse mr-2 -mt-3");
    			add_location(div3, file$1, 94, 2, 2635);
    			attr_dev(div4, "class", "container mx-auto pt-3 px-3 flex flex-col");
    			add_location(div4, file$1, 75, 0, 2148);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, div0);
    			mount_component(input0, div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			mount_component(input1, div1, null);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			mount_component(button, div3, null);
    			append_dev(div4, t2);
    			info.block.m(div4, info.anchor = null);
    			info.mount = () => div4;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const input0_changes = {};

    			if (!updating_value && dirty[0] & /*winners*/ 2) {
    				updating_value = true;
    				input0_changes.value = /*winners*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty[0] & /*runnerups*/ 4) {
    				updating_value_1 = true;
    				input1_changes.value = /*runnerups*/ ctx[2];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    			info.ctx = ctx;

    			if (dirty[0] & /*calculatePromise*/ 256 && promise !== (promise = /*calculatePromise*/ ctx[8]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(button.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(button);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function groupInto4s(array) {
    	let grpsOf4 = [];

    	for (let i = 0; i < array.length; i += 4) {
    		grpsOf4.push(array.slice(i, i + 4));
    	}

    	return grpsOf4;
    }

    function numberOrder(a, b) {
    	return a - b;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Draw', slots, []);
    	let winners = 20;
    	let runnerups = 20;
    	let round = 0;
    	let players = [];
    	let winnersPositions = [];
    	let sorted = false;
    	let sortedWinnersPosition = [];
    	let winnersPositionDisplay = [];
    	let runnerUpsPositions = [];
    	let byesPositions = [];
    	let winnersGrpsOf4;
    	let runnerUpsGrpsOf4;
    	let byesGrpsOf4;
    	let calculatePromise;

    	function calculate() {
    		$$invalidate(4, players = []);
    		$$invalidate(10, winnersPositions = []);
    		$$invalidate(13, runnerUpsPositions = []);
    		$$invalidate(14, byesPositions = []);
    		$$invalidate(3, round = 0);

    		$$invalidate(8, calculatePromise = calculateDraws({ winners, runnerups }).then(data => {
    			$$invalidate(3, round = data.rounds);

    			for (let i = 0; i < round; i++) {
    				players.push(`${i + 1}`);
    			}

    			data.byes.forEach(pos => {
    				$$invalidate(4, players[pos - 1] = `${pos}: BYE`, players);
    				byesPositions.push(pos);
    			});

    			data.winners.forEach((pos, i) => {
    				$$invalidate(4, players[pos - 1] = `${pos}: Winner: ${i + 1}`, players);
    				winnersPositions.push(pos);
    			});

    			data.runnerups.forEach((pos, i) => {
    				$$invalidate(4, players[pos - 1] = `${pos}: Runner-up: ${i + 1}`, players);
    				runnerUpsPositions.push(pos);
    			});

    			$$invalidate(4, players);
    			$$invalidate(10, winnersPositions);
    			runnerUpsPositions.sort(numberOrder);
    			$$invalidate(13, runnerUpsPositions);
    			byesPositions.sort(numberOrder);
    			$$invalidate(14, byesPositions);
    		}));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Draw> was created with unknown prop '${key}'`);
    	});

    	function input0_value_binding(value) {
    		winners = value;
    		$$invalidate(1, winners);
    	}

    	function input1_value_binding(value) {
    		runnerups = value;
    		$$invalidate(2, runnerups);
    	}

    	function checkbox_checked_binding(value) {
    		sorted = value;
    		$$invalidate(0, sorted);
    	}

    	$$self.$capture_state = () => ({
    		Input,
    		Button,
    		Checkbox,
    		Spinner,
    		calculateDraws,
    		SplitDraw,
    		winners,
    		runnerups,
    		round,
    		players,
    		winnersPositions,
    		sorted,
    		sortedWinnersPosition,
    		winnersPositionDisplay,
    		runnerUpsPositions,
    		byesPositions,
    		winnersGrpsOf4,
    		runnerUpsGrpsOf4,
    		byesGrpsOf4,
    		groupInto4s,
    		numberOrder,
    		calculatePromise,
    		calculate
    	});

    	$$self.$inject_state = $$props => {
    		if ('winners' in $$props) $$invalidate(1, winners = $$props.winners);
    		if ('runnerups' in $$props) $$invalidate(2, runnerups = $$props.runnerups);
    		if ('round' in $$props) $$invalidate(3, round = $$props.round);
    		if ('players' in $$props) $$invalidate(4, players = $$props.players);
    		if ('winnersPositions' in $$props) $$invalidate(10, winnersPositions = $$props.winnersPositions);
    		if ('sorted' in $$props) $$invalidate(0, sorted = $$props.sorted);
    		if ('sortedWinnersPosition' in $$props) $$invalidate(11, sortedWinnersPosition = $$props.sortedWinnersPosition);
    		if ('winnersPositionDisplay' in $$props) $$invalidate(12, winnersPositionDisplay = $$props.winnersPositionDisplay);
    		if ('runnerUpsPositions' in $$props) $$invalidate(13, runnerUpsPositions = $$props.runnerUpsPositions);
    		if ('byesPositions' in $$props) $$invalidate(14, byesPositions = $$props.byesPositions);
    		if ('winnersGrpsOf4' in $$props) $$invalidate(5, winnersGrpsOf4 = $$props.winnersGrpsOf4);
    		if ('runnerUpsGrpsOf4' in $$props) $$invalidate(6, runnerUpsGrpsOf4 = $$props.runnerUpsGrpsOf4);
    		if ('byesGrpsOf4' in $$props) $$invalidate(7, byesGrpsOf4 = $$props.byesGrpsOf4);
    		if ('calculatePromise' in $$props) $$invalidate(8, calculatePromise = $$props.calculatePromise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*winnersPositions, sortedWinnersPosition*/ 3072) {
    			{
    				$$invalidate(11, sortedWinnersPosition = [...winnersPositions]);
    				sortedWinnersPosition.sort(numberOrder);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*sorted, sortedWinnersPosition, winnersPositions*/ 3073) {
    			if (sorted) {
    				$$invalidate(12, winnersPositionDisplay = sortedWinnersPosition);
    			} else {
    				$$invalidate(12, winnersPositionDisplay = winnersPositions);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*winnersPositionDisplay*/ 4096) {
    			$$invalidate(5, winnersGrpsOf4 = groupInto4s(winnersPositionDisplay));
    		}

    		if ($$self.$$.dirty[0] & /*runnerUpsPositions*/ 8192) {
    			$$invalidate(6, runnerUpsGrpsOf4 = groupInto4s(runnerUpsPositions));
    		}

    		if ($$self.$$.dirty[0] & /*byesPositions*/ 16384) {
    			$$invalidate(7, byesGrpsOf4 = groupInto4s(byesPositions));
    		}
    	};

    	return [
    		sorted,
    		winners,
    		runnerups,
    		round,
    		players,
    		winnersGrpsOf4,
    		runnerUpsGrpsOf4,
    		byesGrpsOf4,
    		calculatePromise,
    		calculate,
    		winnersPositions,
    		sortedWinnersPosition,
    		winnersPositionDisplay,
    		runnerUpsPositions,
    		byesPositions,
    		input0_value_binding,
    		input1_value_binding,
    		checkbox_checked_binding
    	];
    }

    class Draw extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Draw",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let tailwindcss;
    	let t0;
    	let div0;
    	let h1;
    	let logo;
    	let t1;
    	let t2;
    	let switch_instance;
    	let t3;
    	let footer;
    	let div1;
    	let t4;
    	let a0;
    	let t6;
    	let a1;
    	let current;
    	tailwindcss = new Tailwindcss({ $$inline: true });
    	logo = new Logo({ $$inline: true });
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	const block = {
    		c: function create() {
    			create_component(tailwindcss.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			h1 = element("h1");
    			create_component(logo.$$.fragment);
    			t1 = text("\n    Table Tennis Draw Helper");
    			t2 = space();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t3 = space();
    			footer = element("footer");
    			div1 = element("div");
    			t4 = text("Icons made by\n    ");
    			a0 = element("a");
    			a0.textContent = "Freepik";
    			t6 = text("\n    from\n    ");
    			a1 = element("a");
    			a1.textContent = "www.flaticon.com";
    			attr_dev(h1, "class", "text-white font-bold text-lg flex");
    			add_location(h1, file, 13, 2, 307);
    			attr_dev(div0, "class", "h-12 elevation-4 bg-red-600 flex justify-between items-center pl-6 pr-3");
    			add_location(div0, file, 11, 0, 217);
    			attr_dev(a0, "href", "https://www.flaticon.com/authors/freepik");
    			attr_dev(a0, "class", "mx-1");
    			attr_dev(a0, "title", "Freepik");
    			add_location(a0, file, 27, 4, 769);
    			attr_dev(a1, "href", "https://www.flaticon.com/");
    			attr_dev(a1, "class", "mx-1");
    			attr_dev(a1, "title", "Flaticon");
    			add_location(a1, file, 34, 4, 904);
    			attr_dev(div1, "class", "h-4 flex items-center justify-center text-xs");
    			add_location(div1, file, 25, 2, 688);
    			attr_dev(footer, "class", "fixed w-full bottom-0 bg-red-100 border-t border-b border-red-300 elevation-5");
    			add_location(footer, file, 24, 0, 591);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(tailwindcss, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h1);
    			mount_component(logo, h1, null);
    			append_dev(h1, t1);
    			insert_dev(target, t2, anchor);
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div1);
    			append_dev(div1, t4);
    			append_dev(div1, a0);
    			append_dev(div1, t6);
    			append_dev(div1, a1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, t3.parentNode, t3);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tailwindcss.$$.fragment, local);
    			transition_in(logo.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tailwindcss.$$.fragment, local);
    			transition_out(logo.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tailwindcss, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			destroy_component(logo);
    			if (detaching) detach_dev(t2);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let component = Draw;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Tailwindcss, Logo, Draw, component });

    	$$self.$inject_state = $$props => {
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [component];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
