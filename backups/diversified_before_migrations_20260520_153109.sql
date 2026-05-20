--
-- PostgreSQL database dump
--

\restrict IuFJTOntnywpU2pL0HJfM0D1eUburc1cFAPpQofkWKaXDf8yJaKeh42jqzB9ZZA

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pdino8tpcml3eup; Type: SCHEMA; Schema: -; Owner: diversified
--

CREATE SCHEMA pdino8tpcml3eup;


ALTER SCHEMA pdino8tpcml3eup OWNER TO diversified;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: fn_generate_request_id(); Type: FUNCTION; Schema: public; Owner: diversified
--

CREATE FUNCTION public.fn_generate_request_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.request_id IS NULL THEN
    NEW.request_id := 'REQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.id::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_generate_request_id() OWNER TO diversified;

--
-- Name: set_documents_updated_at(); Type: FUNCTION; Schema: public; Owner: diversified
--

CREATE FUNCTION public.set_documents_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_documents_updated_at() OWNER TO diversified;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: diversified
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW.updated_at := NOW();
      RETURN NEW;
    END;
    $$;


ALTER FUNCTION public.set_updated_at() OWNER TO diversified;

--
-- Name: set_work_orders_updated_at(); Type: FUNCTION; Schema: public; Owner: diversified
--

CREATE FUNCTION public.set_work_orders_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_work_orders_updated_at() OWNER TO diversified;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Features; Type: TABLE; Schema: pdino8tpcml3eup; Owner: diversified
--

CREATE TABLE pdino8tpcml3eup."Features" (
    id integer NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    created_by character varying,
    updated_by character varying,
    nc_order numeric,
    __nc_deleted boolean,
    nc_row_meta jsonb,
    title text
);


ALTER TABLE pdino8tpcml3eup."Features" OWNER TO diversified;

--
-- Name: Features_id_seq; Type: SEQUENCE; Schema: pdino8tpcml3eup; Owner: diversified
--

CREATE SEQUENCE pdino8tpcml3eup."Features_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE pdino8tpcml3eup."Features_id_seq" OWNER TO diversified;

--
-- Name: Features_id_seq; Type: SEQUENCE OWNED BY; Schema: pdino8tpcml3eup; Owner: diversified
--

ALTER SEQUENCE pdino8tpcml3eup."Features_id_seq" OWNED BY pdino8tpcml3eup."Features".id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_user_id uuid,
    action text NOT NULL,
    module text NOT NULL,
    entity_type text,
    entity_id uuid,
    before_data jsonb,
    after_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    actor_user_id_text text,
    entity_id_text text
);


ALTER TABLE public.audit_logs OWNER TO diversified;

--
-- Name: automation_events; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.automation_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    source_module text NOT NULL,
    entity_type text,
    entity_id uuid,
    payload jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending'::text,
    n8n_webhook_url text,
    response_status integer,
    response_body text,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone
);


ALTER TABLE public.automation_events OWNER TO diversified;

--
-- Name: calendar_blocks; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.calendar_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    block_type text NOT NULL,
    status text DEFAULT 'scheduled'::text,
    priority text,
    assigned_to uuid,
    linked_task_id uuid,
    linked_work_order_id uuid,
    company_division text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    all_day boolean DEFAULT false,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    assigned_to_employee_id integer,
    linked_task_int_id integer,
    linked_work_order_int_id integer,
    created_by_user_id integer,
    CONSTRAINT calendar_blocks_time_check CHECK ((end_time > start_time))
);


ALTER TABLE public.calendar_blocks OWNER TO diversified;

--
-- Name: calendar_sync_logs; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.calendar_sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer,
    provider text DEFAULT 'microsoft_365'::text,
    status text,
    message text,
    event_count integer DEFAULT 0,
    started_at timestamp with time zone DEFAULT now(),
    finished_at timestamp with time zone,
    metadata jsonb
);


ALTER TABLE public.calendar_sync_logs OWNER TO diversified;

--
-- Name: document_audit_logs; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.document_audit_logs (
    id integer NOT NULL,
    document_id integer NOT NULL,
    action text NOT NULL,
    performed_by integer,
    details text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.document_audit_logs OWNER TO diversified;

--
-- Name: document_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.document_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.document_audit_logs_id_seq OWNER TO diversified;

--
-- Name: document_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.document_audit_logs_id_seq OWNED BY public.document_audit_logs.id;


--
-- Name: document_signatures; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.document_signatures (
    id integer NOT NULL,
    document_id integer NOT NULL,
    signer_name text NOT NULL,
    signer_email text,
    signer_role text,
    signature_order integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'pending_signature'::text NOT NULL,
    signed_at timestamp with time zone,
    signature_data text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT document_signatures_status_check CHECK ((status = ANY (ARRAY['pending_signature'::text, 'signed'::text, 'declined'::text, 'expired'::text])))
);


ALTER TABLE public.document_signatures OWNER TO diversified;

--
-- Name: document_signatures_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.document_signatures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.document_signatures_id_seq OWNER TO diversified;

--
-- Name: document_signatures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.document_signatures_id_seq OWNED BY public.document_signatures.id;


--
-- Name: document_versions; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.document_versions (
    id integer NOT NULL,
    document_id integer NOT NULL,
    version_number integer DEFAULT 1 NOT NULL,
    file_url text,
    changes_description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.document_versions OWNER TO diversified;

--
-- Name: document_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.document_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.document_versions_id_seq OWNER TO diversified;

--
-- Name: document_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.document_versions_id_seq OWNED BY public.document_versions.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    document_type text DEFAULT 'document'::text NOT NULL,
    entity_type text,
    entity_id integer,
    title text NOT NULL,
    file_path text,
    file_url text,
    storage_url text,
    file_size bigint,
    mime_type text DEFAULT 'application/pdf'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    sign_status text DEFAULT 'unsigned'::text NOT NULL,
    generated_by integer,
    signed_by integer,
    signed_at timestamp with time zone,
    signature_data jsonb,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    generated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    file_id uuid,
    category text,
    owner_id uuid,
    company_division text,
    created_by uuid,
    CONSTRAINT documents_sign_status_check CHECK ((sign_status = ANY (ARRAY['unsigned'::text, 'pending_signature'::text, 'partially_signed'::text, 'signed'::text, 'declined'::text, 'expired'::text]))),
    CONSTRAINT documents_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'generated'::text, 'sent'::text, 'viewed'::text, 'archived'::text, 'cancelled'::text])))
);


ALTER TABLE public.documents OWNER TO diversified;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.documents_id_seq OWNER TO diversified;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(255),
    department character varying(255),
    status character varying(50) DEFAULT 'active'::character varying,
    email character varying(255),
    phone character varying(50),
    avatar_url text,
    hire_date date,
    created_at timestamp with time zone DEFAULT now(),
    password_hash text,
    last_login_at timestamp with time zone,
    auth_provider text,
    auth_subject text,
    auth_last_synced_at timestamp with time zone
);


ALTER TABLE public.employees OWNER TO diversified;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.employees_id_seq OWNER TO diversified;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: file_records; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.file_records (
    id integer NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'document'::text NOT NULL,
    uploaded_by text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    size_bytes bigint DEFAULT 0 NOT NULL,
    url text DEFAULT ''::text NOT NULL,
    linked_task_id integer,
    linked_request_id integer,
    linked_work_order_id integer,
    linked_sop_id integer,
    original_name text,
    stored_name text,
    storage_path text,
    mime_type text,
    uploaded_by_user_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    linked_entity_type text,
    linked_entity_id integer,
    CONSTRAINT file_records_linked_entity_check CHECK ((((linked_entity_type IS NULL) AND (linked_entity_id IS NULL)) OR ((linked_entity_type = ANY (ARRAY['task'::text, 'request'::text, 'work_order'::text, 'sop'::text, 'inventory'::text, 'employee'::text, 'document'::text])) AND (linked_entity_id IS NOT NULL))))
);


ALTER TABLE public.file_records OWNER TO diversified;

--
-- Name: file_records_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.file_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.file_records_id_seq OWNER TO diversified;

--
-- Name: file_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.file_records_id_seq OWNED BY public.file_records.id;


--
-- Name: files; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    original_name text NOT NULL,
    stored_name text NOT NULL,
    storage_path text NOT NULL,
    mime_type text,
    size_bytes bigint,
    category text,
    linked_entity_type text,
    linked_entity_id uuid,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.files OWNER TO diversified;

--
-- Name: forms; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.forms (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(100),
    submitted_by integer,
    status character varying(50) DEFAULT 'pending'::character varying,
    form_data jsonb,
    submitted_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.forms OWNER TO diversified;

--
-- Name: forms_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.forms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.forms_id_seq OWNER TO diversified;

--
-- Name: forms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.forms_id_seq OWNED BY public.forms.id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.inventory (
    id integer NOT NULL,
    item_name character varying(255) NOT NULL,
    category character varying(100),
    quantity integer DEFAULT 0,
    unit character varying(50),
    location character varying(255),
    status character varying(50) DEFAULT 'in_stock'::character varying,
    reorder_threshold integer,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inventory OWNER TO diversified;

--
-- Name: inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.inventory_id_seq OWNER TO diversified;

--
-- Name: inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;


--
-- Name: microsoft_connections; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.microsoft_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    microsoft_user_id text,
    email text,
    display_name text,
    tenant_id text,
    access_token_enc text,
    refresh_token_enc text,
    token_expires_at timestamp with time zone,
    scopes text,
    status text DEFAULT 'connected'::text,
    last_sync_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.microsoft_connections OWNER TO diversified;

--
-- Name: nc_api_token_scopes; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_api_token_scopes (
    id character varying(20) NOT NULL,
    fk_api_token_id character varying(20) NOT NULL,
    resource_type character varying(20) NOT NULL,
    resource_id character varying(20) NOT NULL,
    permissions text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_api_token_scopes OWNER TO diversified;

--
-- Name: nc_api_tokens; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_api_tokens (
    id integer NOT NULL,
    base_id character varying(20),
    db_alias character varying(255),
    description character varying(255),
    permissions text,
    token text,
    expiry character varying(255),
    enabled boolean DEFAULT true,
    fk_user_id character varying(20),
    fk_workspace_id character varying(20),
    fk_sso_client_id character varying(20),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    token_hash character varying(64),
    token_prefix character varying(20),
    last_used_at timestamp with time zone
);


ALTER TABLE public.nc_api_tokens OWNER TO diversified;

--
-- Name: nc_api_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.nc_api_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.nc_api_tokens_id_seq OWNER TO diversified;

--
-- Name: nc_api_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.nc_api_tokens_id_seq OWNED BY public.nc_api_tokens.id;


--
-- Name: nc_audit_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_audit_v2 (
    id uuid NOT NULL,
    "user" character varying(255),
    ip character varying(255),
    source_id character varying(20),
    base_id character varying(20),
    fk_model_id character varying(20),
    row_id character varying(255),
    op_type character varying(255),
    op_sub_type character varying(255),
    status character varying(255),
    description text,
    details text,
    fk_user_id character varying(20),
    fk_ref_id character varying(20),
    fk_parent_id uuid,
    fk_workspace_id character varying(20),
    fk_org_id character varying(20),
    user_agent text,
    version smallint DEFAULT '0'::smallint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    old_id character varying(20)
);


ALTER TABLE public.nc_audit_v2 OWNER TO diversified;

--
-- Name: nc_automation_executions; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_automation_executions (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_workflow_id character varying(20) NOT NULL,
    workflow_data text,
    execution_data text,
    finished boolean DEFAULT false,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    status character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    resume_at timestamp with time zone,
    error_notified_at timestamp with time zone
);


ALTER TABLE public.nc_automation_executions OWNER TO diversified;

--
-- Name: nc_automation_subscribers; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_automation_subscribers (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_automation_id character varying(20),
    fk_user_id character varying(20),
    notify_on_error boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_automation_subscribers OWNER TO diversified;

--
-- Name: nc_automations; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_automations (
    id character varying(20) NOT NULL,
    title character varying(255),
    description text,
    meta text,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    "order" real,
    type character varying(20),
    created_by character varying(20),
    updated_by character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    enabled boolean DEFAULT false,
    nodes text,
    edges text,
    draft text,
    config text,
    script text,
    draft_reminder_sent_at timestamp with time zone,
    deleted boolean
);


ALTER TABLE public.nc_automations OWNER TO diversified;

--
-- Name: nc_base_users_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_base_users_v2 (
    base_id character varying(20) NOT NULL,
    fk_user_id character varying(20) NOT NULL,
    roles text,
    starred boolean,
    pinned boolean,
    "group" character varying(255),
    color character varying(255),
    "order" real,
    hidden real,
    opened_date timestamp with time zone,
    invited_by character varying(20),
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_base_users_v2 OWNER TO diversified;

--
-- Name: nc_base_variables; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_base_variables (
    id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    key character varying(255),
    value text,
    description text,
    inheritance character varying(20) DEFAULT 'fixed'::character varying,
    type character varying(20) DEFAULT 'text'::character varying,
    "order" real,
    default_value text,
    is_overridden boolean DEFAULT false,
    is_inherited boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_base_variables OWNER TO diversified;

--
-- Name: nc_bases_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_bases_v2 (
    id character varying(128) NOT NULL,
    title character varying(255),
    prefix character varying(255),
    status character varying(255),
    description text,
    meta text,
    color character varying(255),
    uuid character varying(255),
    password character varying(255),
    roles character varying(255),
    deleted boolean DEFAULT false,
    is_meta boolean,
    "order" real,
    type character varying(200),
    fk_workspace_id character varying(20),
    is_snapshot boolean DEFAULT false,
    fk_custom_url_id character varying(20),
    version smallint DEFAULT '2'::smallint,
    default_role character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    managed_app_master boolean DEFAULT false,
    managed_app_id character varying(20),
    managed_app_version_id character varying(20),
    auto_update boolean DEFAULT true,
    is_sandbox_production boolean DEFAULT false,
    is_sandbox boolean DEFAULT false
);


ALTER TABLE public.nc_bases_v2 OWNER TO diversified;

--
-- Name: nc_calendar_view_columns_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_calendar_view_columns_v2 (
    id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    source_id character varying(20),
    fk_view_id character varying(20),
    fk_column_id character varying(20),
    show boolean,
    bold boolean,
    underline boolean,
    italic boolean,
    "order" real,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_calendar_view_columns_v2 OWNER TO diversified;

--
-- Name: nc_calendar_view_range_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_calendar_view_range_v2 (
    id character varying(20) NOT NULL,
    fk_view_id character varying(20),
    fk_to_column_id character varying(20),
    label character varying(40),
    fk_from_column_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_calendar_view_range_v2 OWNER TO diversified;

--
-- Name: nc_calendar_view_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_calendar_view_v2 (
    fk_view_id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    source_id character varying(20),
    title character varying(255),
    fk_cover_image_col_id character varying(20),
    meta text,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.nc_calendar_view_v2 OWNER TO diversified;

--
-- Name: nc_chat_messages; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_chat_messages (
    id character varying(20) NOT NULL,
    fk_session_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20) NOT NULL,
    role character varying(20) NOT NULL,
    content text,
    parts text,
    model character varying(100),
    input_tokens integer DEFAULT 0,
    output_tokens integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    base_id character varying(20),
    bt_span_id character varying(100),
    files text
);


ALTER TABLE public.nc_chat_messages OWNER TO diversified;

--
-- Name: nc_chat_sessions; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_chat_sessions (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20) NOT NULL,
    fk_user_id character varying(20),
    title character varying(255),
    summary text,
    total_input_tokens integer DEFAULT 0,
    total_output_tokens integer DEFAULT 0,
    message_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    meta text,
    base_id character varying(20)
);


ALTER TABLE public.nc_chat_sessions OWNER TO diversified;

--
-- Name: nc_col_barcode_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_col_barcode_v2 (
    id character varying(20) NOT NULL,
    fk_column_id character varying(20),
    fk_barcode_value_column_id character varying(20),
    barcode_format character varying(15),
    deleted boolean,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    error text
);


ALTER TABLE public.nc_col_barcode_v2 OWNER TO diversified;

--
-- Name: nc_col_button_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_col_button_v2 (
    id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    type character varying(255),
    label text,
    theme character varying(255),
    color character varying(255),
    icon character varying(255),
    formula text,
    formula_raw text,
    error character varying(255),
    parsed_tree text,
    fk_webhook_id character varying(20),
    fk_column_id character varying(20),
    fk_integration_id character varying(20),
    model character varying(255),
    output_column_ids text,
    fk_workspace_id character varying(20),
    fk_script_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_col_button_v2 OWNER TO diversified;

--
-- Name: nc_col_formula_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_col_formula_v2 (
    id character varying(20) NOT NULL,
    fk_column_id character varying(20),
    formula text NOT NULL,
    formula_raw text,
    error text,
    deleted boolean,
    "order" real,
    parsed_tree text,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_col_formula_v2 OWNER TO diversified;

--
-- Name: nc_col_long_text_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_col_long_text_v2 (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_model_id character varying(20),
    fk_column_id character varying(20),
    fk_integration_id character varying(20),
    model character varying(255),
    prompt text,
    prompt_raw text,
    error text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_col_long_text_v2 OWNER TO diversified;

--
-- Name: nc_col_lookup_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_col_lookup_v2 (
    id character varying(20) NOT NULL,
    fk_column_id character varying(20),
    fk_relation_column_id character varying(20),
    fk_lookup_column_id character varying(20),
    deleted boolean,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    error text
);


ALTER TABLE public.nc_col_lookup_v2 OWNER TO diversified;

--
-- Name: nc_col_qrcode_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_col_qrcode_v2 (
    id character varying(20) NOT NULL,
    fk_column_id character varying(20),
    fk_qr_value_column_id character varying(20),
    deleted boolean,
    "order" real,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    error text
);


ALTER TABLE public.nc_col_qrcode_v2 OWNER TO diversified;

--
-- Name: nc_col_relations_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_col_relations_v2 (
    id character varying(20) NOT NULL,
    ref_db_alias character varying(255),
    type character varying(255),
    virtual boolean,
    db_type character varying(255),
    fk_column_id character varying(20),
    fk_related_model_id character varying(20),
    fk_child_column_id character varying(20),
    fk_parent_column_id character varying(20),
    fk_mm_model_id character varying(20),
    fk_mm_child_column_id character varying(20),
    fk_mm_parent_column_id character varying(20),
    ur character varying(255),
    dr character varying(255),
    fk_index_name character varying(255),
    deleted boolean,
    fk_target_view_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    fk_related_base_id character varying(20),
    fk_mm_base_id character varying(20),
    fk_related_source_id character varying(20),
    fk_mm_source_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    version integer DEFAULT 1,
    fk_display_value_column_id character varying(20)
);


ALTER TABLE public.nc_col_relations_v2 OWNER TO diversified;

--
-- Name: nc_col_rollup_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_col_rollup_v2 (
    id character varying(20) NOT NULL,
    fk_column_id character varying(20),
    fk_relation_column_id character varying(20),
    fk_rollup_column_id character varying(20),
    rollup_function character varying(255),
    deleted boolean,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    error text
);


ALTER TABLE public.nc_col_rollup_v2 OWNER TO diversified;

--
-- Name: nc_col_select_options_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_col_select_options_v2 (
    id character varying(20) NOT NULL,
    fk_column_id character varying(20),
    title character varying(255),
    color character varying(255),
    "order" real,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_col_select_options_v2 OWNER TO diversified;

--
-- Name: nc_columns_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_columns_v2 (
    id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_model_id character varying(20),
    title character varying(255),
    column_name character varying(255),
    uidt character varying(255),
    dt character varying(255),
    np character varying(255),
    ns character varying(255),
    clen character varying(255),
    cop character varying(255),
    pk boolean,
    pv boolean,
    rqd boolean,
    un boolean,
    ct text,
    ai boolean,
    "unique" boolean,
    cdf text,
    cc text,
    csn character varying(255),
    dtx character varying(255),
    dtxp text,
    dtxs character varying(255),
    au boolean,
    validate text,
    virtual boolean,
    deleted boolean,
    system boolean DEFAULT false,
    "order" real,
    meta text,
    description text,
    readonly boolean DEFAULT false,
    fk_workspace_id character varying(20),
    custom_index_name character varying(64),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    internal_meta text
);


ALTER TABLE public.nc_columns_v2 OWNER TO diversified;

--
-- Name: nc_comment_reactions; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_comment_reactions (
    id character varying(20) NOT NULL,
    row_id character varying(255),
    comment_id character varying(20),
    source_id character varying(20),
    fk_model_id character varying(20),
    base_id character varying(20) NOT NULL,
    reaction character varying(255),
    created_by character varying(255),
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_comment_reactions OWNER TO diversified;

--
-- Name: nc_comments; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_comments (
    id character varying(20) NOT NULL,
    row_id character varying(255),
    comment text,
    created_by character varying(20),
    created_by_email character varying(255),
    resolved_by character varying(20),
    resolved_by_email character varying(255),
    parent_comment_id character varying(20),
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_model_id character varying(20),
    is_deleted boolean,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_doc_id character varying(20),
    anchor_id character varying(20)
);


ALTER TABLE public.nc_comments OWNER TO diversified;

--
-- Name: nc_custom_urls_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_custom_urls_v2 (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_model_id character varying(20),
    view_id character varying(20),
    original_path character varying(255),
    custom_path character varying(255),
    fk_dashboard_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_custom_urls_v2 OWNER TO diversified;

--
-- Name: nc_dashboards_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_dashboards_v2 (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    meta text,
    "order" integer,
    created_by character varying(20),
    owned_by character varying(20),
    uuid character varying(255),
    password character varying(255),
    fk_custom_url_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted boolean
);


ALTER TABLE public.nc_dashboards_v2 OWNER TO diversified;

--
-- Name: nc_data_reflection; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_data_reflection (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    username character varying(255),
    password character varying(255),
    database character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_data_reflection OWNER TO diversified;

--
-- Name: nc_date_dependency_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_date_dependency_v2 (
    id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    fk_model_id character varying(20),
    fk_start_date_field_id character varying(20),
    fk_end_date_field_id character varying(20),
    fk_duration_field_id character varying(20),
    fk_dependency_linkrow_field_id character varying(20),
    dependency_linkrow_role character varying(20) DEFAULT 'predecessors'::character varying,
    dependency_connection_type character varying(20) DEFAULT 'end-to-start'::character varying,
    dependency_buffer_type character varying(20) DEFAULT 'none'::character varying,
    dependency_buffer_days integer DEFAULT 0,
    include_weekends boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_date_dependency_v2 OWNER TO diversified;

--
-- Name: nc_db_servers; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_db_servers (
    id character varying(20) NOT NULL,
    title character varying(255),
    is_shared boolean DEFAULT true,
    max_tenant_count integer,
    current_tenant_count integer DEFAULT 0,
    config text,
    conditions text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_db_servers OWNER TO diversified;

--
-- Name: nc_dependency_tracker; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_dependency_tracker (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    source_type character varying(50) NOT NULL,
    source_id character varying(20) NOT NULL,
    dependent_type character varying(50) NOT NULL,
    dependent_id character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    queryable_field_0 text,
    queryable_field_1 text,
    meta text,
    queryable_field_2 timestamp with time zone
);


ALTER TABLE public.nc_dependency_tracker OWNER TO diversified;

--
-- Name: nc_disabled_models_for_role_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_disabled_models_for_role_v2 (
    id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_view_id character varying(20),
    role character varying(45),
    disabled boolean DEFAULT true,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_disabled_models_for_role_v2 OWNER TO diversified;

--
-- Name: nc_doc_content_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_doc_content_v2 (
    fk_doc_id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    content jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_doc_content_v2 OWNER TO diversified;

--
-- Name: nc_docs_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_docs_v2 (
    id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    title character varying(512),
    meta text,
    "order" real,
    parent_id character varying(20),
    deleted boolean DEFAULT false,
    has_children boolean DEFAULT false,
    version integer DEFAULT 1,
    created_by character varying(20),
    updated_by character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_docs_v2 OWNER TO diversified;

--
-- Name: nc_extensions; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_extensions (
    id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    fk_user_id character varying(20),
    extension_id character varying(255),
    title character varying(255),
    kv_store text,
    meta text,
    "order" real,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted boolean
);


ALTER TABLE public.nc_extensions OWNER TO diversified;

--
-- Name: nc_file_references; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_file_references (
    id character varying(20) NOT NULL,
    storage character varying(255),
    file_url text,
    file_size integer,
    fk_user_id character varying(20),
    fk_workspace_id character varying(20),
    base_id character varying(20),
    source_id character varying(20),
    fk_model_id character varying(20),
    fk_column_id character varying(20),
    is_external boolean DEFAULT false,
    deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_doc_id character varying(20),
    fk_session_id character varying(20),
    soft_deleted boolean DEFAULT false
);


ALTER TABLE public.nc_file_references OWNER TO diversified;

--
-- Name: nc_filter_exp_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_filter_exp_v2 (
    id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_view_id character varying(20),
    fk_hook_id character varying(20),
    fk_column_id character varying(20),
    fk_parent_id character varying(20),
    logical_op character varying(255),
    comparison_op character varying(255),
    value text,
    is_group boolean,
    "order" real,
    comparison_sub_op character varying(255),
    fk_link_col_id character varying(20),
    fk_value_col_id character varying(20),
    fk_parent_column_id character varying(20),
    fk_workspace_id character varying(20),
    fk_row_color_condition_id character varying(20),
    fk_widget_id character varying(20),
    meta text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    enabled boolean DEFAULT true,
    fk_rls_policy_id character varying(20),
    fk_level_id character varying(20),
    fk_button_col_id character varying(20)
);


ALTER TABLE public.nc_filter_exp_v2 OWNER TO diversified;

--
-- Name: nc_follower; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_follower (
    fk_user_id character varying(20) NOT NULL,
    fk_follower_id character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_follower OWNER TO diversified;

--
-- Name: nc_form_view_columns_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_form_view_columns_v2 (
    id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_view_id character varying(20),
    fk_column_id character varying(20),
    uuid character varying(255),
    label text,
    help text,
    description text,
    required boolean,
    show boolean,
    "order" real,
    meta text,
    enable_scanner boolean,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    row_id character varying(32)
);


ALTER TABLE public.nc_form_view_columns_v2 OWNER TO diversified;

--
-- Name: nc_form_view_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_form_view_v2 (
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_view_id character varying(20) NOT NULL,
    heading character varying(255),
    subheading text,
    success_msg text,
    redirect_url text,
    redirect_after_secs character varying(255),
    email character varying(255),
    submit_another_form boolean,
    show_blank_form boolean,
    uuid character varying(255),
    banner_image_url text,
    logo_url text,
    meta text,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    starts_at timestamp with time zone,
    expires_at timestamp with time zone
);


ALTER TABLE public.nc_form_view_v2 OWNER TO diversified;

--
-- Name: nc_gallery_view_columns_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_gallery_view_columns_v2 (
    id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_view_id character varying(20),
    fk_column_id character varying(20),
    uuid character varying(255),
    label character varying(255),
    help character varying(255),
    show boolean,
    "order" real,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_gallery_view_columns_v2 OWNER TO diversified;

--
-- Name: nc_gallery_view_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_gallery_view_v2 (
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_view_id character varying(20) NOT NULL,
    next_enabled boolean,
    prev_enabled boolean,
    cover_image_idx integer,
    fk_cover_image_col_id character varying(20),
    cover_image character varying(255),
    restrict_types character varying(255),
    restrict_size character varying(255),
    restrict_number character varying(255),
    public boolean,
    dimensions character varying(255),
    responsive_columns character varying(255),
    meta text,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_gallery_view_v2 OWNER TO diversified;

--
-- Name: nc_gcp_marketplace_accounts; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_gcp_marketplace_accounts (
    id character varying(20) NOT NULL,
    procurement_account_id character varying(255) NOT NULL,
    fk_user_id character varying(20),
    state character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    link_token character varying(64),
    link_token_expires_at timestamp with time zone,
    meta text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_gcp_marketplace_accounts OWNER TO diversified;

--
-- Name: nc_gcp_marketplace_entitlements; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_gcp_marketplace_entitlements (
    id character varying(20) NOT NULL,
    entitlement_id character varying(255) NOT NULL,
    fk_gcp_account_id character varying(20) NOT NULL,
    fk_installation_id character varying(20),
    plan character varying(255),
    state character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    meta text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_gcp_marketplace_entitlements OWNER TO diversified;

--
-- Name: nc_grid_view_columns_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_grid_view_columns_v2 (
    id character varying(20) NOT NULL,
    fk_view_id character varying(20),
    fk_column_id character varying(20),
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    uuid character varying(255),
    label character varying(255),
    help character varying(255),
    width character varying(255) DEFAULT '200px'::character varying,
    show boolean,
    "order" real,
    group_by boolean,
    group_by_order real,
    group_by_sort character varying(255),
    aggregation character varying(30) DEFAULT NULL::character varying,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_grid_view_columns_v2 OWNER TO diversified;

--
-- Name: nc_grid_view_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_grid_view_v2 (
    fk_view_id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    uuid character varying(255),
    meta text,
    row_height integer,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_grid_view_v2 OWNER TO diversified;

--
-- Name: nc_hook_logs_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_hook_logs_v2 (
    id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_hook_id character varying(20),
    type character varying(255),
    event character varying(255),
    operation character varying(255),
    test_call boolean DEFAULT true,
    payload text,
    conditions text,
    notification text,
    error_code character varying(255),
    error_message character varying(255),
    error text,
    execution_time integer,
    response text,
    triggered_by character varying(255),
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    error_notified_at timestamp with time zone
);


ALTER TABLE public.nc_hook_logs_v2 OWNER TO diversified;

--
-- Name: nc_hook_trigger_fields; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_hook_trigger_fields (
    fk_hook_id character varying(20) NOT NULL,
    fk_column_id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_hook_trigger_fields OWNER TO diversified;

--
-- Name: nc_hooks_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_hooks_v2 (
    id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_model_id character varying(20),
    title character varying(255),
    description character varying(255),
    env character varying(255) DEFAULT 'all'::character varying,
    type character varying(255),
    event character varying(255),
    operation character varying(255),
    async boolean DEFAULT false,
    payload boolean DEFAULT true,
    url text,
    headers text,
    condition boolean DEFAULT false,
    notification text,
    retries integer DEFAULT 0,
    retry_interval integer DEFAULT 60000,
    timeout integer DEFAULT 60000,
    active boolean DEFAULT true,
    version character varying(255),
    trigger_field boolean DEFAULT false,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted boolean
);


ALTER TABLE public.nc_hooks_v2 OWNER TO diversified;

--
-- Name: nc_installations; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_installations (
    id character varying(20) NOT NULL,
    fk_subscription_id character varying(20),
    licensed_to character varying(255) NOT NULL,
    license_key character varying(255) NOT NULL,
    installation_secret character varying(255),
    installed_at timestamp with time zone,
    last_seen_at timestamp with time zone,
    expires_at timestamp with time zone,
    license_type character varying(255) NOT NULL,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    seat_count integer DEFAULT 0 NOT NULL,
    config text,
    meta text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_user_id character varying(20),
    min_seats integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.nc_installations OWNER TO diversified;

--
-- Name: nc_integration_links_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_integration_links_v2 (
    id character varying(20) NOT NULL,
    fk_integration_id character varying(20),
    base_id character varying(20),
    fk_workspace_id character varying(20),
    created_by character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_integration_links_v2 OWNER TO diversified;

--
-- Name: nc_integrations_store_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_integrations_store_v2 (
    id character varying(20) NOT NULL,
    fk_integration_id character varying(20),
    type character varying(20),
    sub_type character varying(20),
    fk_workspace_id character varying(20),
    fk_user_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    slot_0 text,
    slot_1 text,
    slot_2 text,
    slot_3 text,
    slot_4 text,
    slot_5 integer,
    slot_6 integer,
    slot_7 integer,
    slot_8 integer,
    slot_9 integer
);


ALTER TABLE public.nc_integrations_store_v2 OWNER TO diversified;

--
-- Name: nc_integrations_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_integrations_v2 (
    id character varying(20) NOT NULL,
    title character varying(128),
    config text,
    meta text,
    type character varying(20),
    sub_type character varying(20),
    fk_workspace_id character varying(20),
    is_private boolean DEFAULT false,
    deleted boolean DEFAULT false,
    created_by character varying(20),
    "order" real,
    is_default boolean DEFAULT false,
    is_encrypted boolean DEFAULT false,
    is_global boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_restricted boolean DEFAULT false
);


ALTER TABLE public.nc_integrations_v2 OWNER TO diversified;

--
-- Name: nc_jobs; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_jobs (
    id character varying(20) NOT NULL,
    job character varying(255),
    status character varying(20),
    result text,
    fk_user_id character varying(20),
    fk_workspace_id character varying(20),
    base_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_jobs OWNER TO diversified;

--
-- Name: nc_kanban_view_columns_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_kanban_view_columns_v2 (
    id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_view_id character varying(20),
    fk_column_id character varying(20),
    uuid character varying(255),
    label character varying(255),
    help character varying(255),
    show boolean,
    "order" real,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_kanban_view_columns_v2 OWNER TO diversified;

--
-- Name: nc_kanban_view_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_kanban_view_v2 (
    fk_view_id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    show boolean,
    "order" real,
    uuid character varying(255),
    title character varying(255),
    public boolean,
    password character varying(255),
    show_all_fields boolean,
    fk_grp_col_id character varying(20),
    fk_cover_image_col_id character varying(20),
    meta text,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_kanban_view_v2 OWNER TO diversified;

--
-- Name: nc_list_view_columns_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_list_view_columns_v2 (
    id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    source_id character varying(128),
    fk_view_id character varying(20),
    fk_column_id character varying(20),
    fk_level_id character varying(20),
    show boolean,
    "order" real,
    width character varying(255),
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_list_view_columns_v2 OWNER TO diversified;

--
-- Name: nc_list_view_levels_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_list_view_levels_v2 (
    id character varying(20) NOT NULL,
    fk_view_id character varying(20),
    level integer,
    fk_model_id character varying(20),
    fk_link_column_id character varying(20),
    enable_nested_records boolean,
    fk_self_link_column_id character varying(20),
    wrap_headers boolean,
    meta text,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_list_view_levels_v2 OWNER TO diversified;

--
-- Name: nc_list_view_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_list_view_v2 (
    fk_view_id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    source_id character varying(128),
    title character varying(255),
    show_empty_parents boolean,
    row_height integer,
    fk_prefix_column_id character varying(20),
    meta text,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_list_view_v2 OWNER TO diversified;

--
-- Name: nc_managed_app_deployment_logs; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_managed_app_deployment_logs (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    fk_managed_app_id character varying(20) NOT NULL,
    from_version_id character varying(20),
    to_version_id character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    deployment_type character varying(20) NOT NULL,
    error_message text,
    deployment_log text,
    meta text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone
);


ALTER TABLE public.nc_managed_app_deployment_logs OWNER TO diversified;

--
-- Name: nc_managed_app_versions; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_managed_app_versions (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20) NOT NULL,
    fk_managed_app_id character varying(20) NOT NULL,
    version character varying(20) NOT NULL,
    version_number integer NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    schema text,
    release_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    published_at timestamp with time zone
);


ALTER TABLE public.nc_managed_app_versions OWNER TO diversified;

--
-- Name: nc_managed_apps; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_managed_apps (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    created_by character varying(20) NOT NULL,
    visibility character varying(20) DEFAULT 'private'::character varying NOT NULL,
    category character varying(255),
    install_count integer DEFAULT 0,
    meta text,
    deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    published_at timestamp with time zone
);


ALTER TABLE public.nc_managed_apps OWNER TO diversified;

--
-- Name: nc_map_view_columns_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_map_view_columns_v2 (
    id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    project_id character varying(128),
    fk_view_id character varying(20),
    fk_column_id character varying(20),
    uuid character varying(255),
    label character varying(255),
    help character varying(255),
    show boolean,
    "order" real,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    source_id character varying(20)
);


ALTER TABLE public.nc_map_view_columns_v2 OWNER TO diversified;

--
-- Name: nc_map_view_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_map_view_v2 (
    fk_view_id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    uuid character varying(255),
    title character varying(255),
    fk_geo_data_col_id character varying(20),
    meta text,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.nc_map_view_v2 OWNER TO diversified;

--
-- Name: nc_mcp_tokens; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_mcp_tokens (
    id character varying(20) NOT NULL,
    title character varying(512),
    base_id character varying(20) NOT NULL,
    token character varying(32),
    fk_workspace_id character varying(20),
    "order" real,
    fk_user_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_mcp_tokens OWNER TO diversified;

--
-- Name: nc_model_stats_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_model_stats_v2 (
    fk_workspace_id character varying(20) NOT NULL,
    fk_model_id character varying(20) NOT NULL,
    row_count integer DEFAULT 0,
    is_external boolean DEFAULT false,
    base_id character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_model_stats_v2 OWNER TO diversified;

--
-- Name: nc_models_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_models_v2 (
    id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    table_name character varying(255),
    title character varying(255),
    type character varying(255) DEFAULT 'table'::character varying,
    meta text,
    schema text,
    enabled boolean DEFAULT true,
    mm boolean DEFAULT false,
    tags character varying(255),
    pinned boolean,
    deleted boolean,
    "order" real,
    description text,
    synced boolean DEFAULT false,
    fk_workspace_id character varying(20),
    created_by character varying(20),
    owned_by character varying(20),
    uuid character varying(255),
    password character varying(255),
    fk_custom_url_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    parent_id character varying(20),
    updated_by character varying(20),
    has_children boolean DEFAULT false,
    doc_version integer DEFAULT 1,
    trash_disabled boolean,
    trash_retention_days integer
);


ALTER TABLE public.nc_models_v2 OWNER TO diversified;

--
-- Name: nc_oauth_authorization_codes; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_oauth_authorization_codes (
    code character varying(32) NOT NULL,
    fk_client_id character varying(32),
    fk_user_id character varying(20),
    code_challenge character varying(255),
    code_challenge_method character varying(10) DEFAULT 'S256'::character varying,
    redirect_uri character varying(255),
    scope character varying(255),
    state character varying(1024),
    resource character varying(255),
    granted_resources text,
    expires_at timestamp with time zone NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_oauth_authorization_codes OWNER TO diversified;

--
-- Name: nc_oauth_clients; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_oauth_clients (
    client_id character varying(32) NOT NULL,
    client_secret character varying(128),
    client_type character varying(255),
    client_name character varying(255),
    client_description text,
    client_uri character varying(255),
    logo_uri character varying(255),
    redirect_uris text,
    allowed_grant_types text,
    response_types text,
    allowed_scopes text,
    registration_access_token character varying(255),
    registration_client_uri character varying(255),
    client_id_issued_at bigint,
    client_secret_expires_at bigint,
    fk_user_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_oauth_clients OWNER TO diversified;

--
-- Name: nc_oauth_tokens; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_oauth_tokens (
    id character varying(20) NOT NULL,
    fk_client_id character varying(32),
    fk_user_id character varying(20),
    access_token text,
    access_token_expires_at timestamp with time zone,
    refresh_token text,
    refresh_token_expires_at timestamp with time zone,
    resource character varying(255),
    audience character varying(255),
    granted_resources text,
    scope character varying(255),
    is_revoked boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE public.nc_oauth_tokens OWNER TO diversified;

--
-- Name: nc_org; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_org (
    id character varying(20) NOT NULL,
    title character varying(255),
    slug character varying(255),
    fk_user_id character varying(20),
    meta text,
    image character varying(255),
    is_share_enabled boolean DEFAULT false,
    deleted boolean DEFAULT false,
    "order" real,
    fk_db_instance_id character varying(20),
    stripe_customer_id character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_org OWNER TO diversified;

--
-- Name: nc_org_domain; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_org_domain (
    id character varying(20) NOT NULL,
    fk_org_id character varying(20),
    fk_user_id character varying(20),
    domain character varying(255),
    verified boolean,
    txt_value character varying(255),
    last_verified timestamp with time zone,
    deleted boolean DEFAULT false,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_org_domain OWNER TO diversified;

--
-- Name: nc_org_users; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_org_users (
    fk_org_id character varying(20) NOT NULL,
    fk_user_id character varying(20) NOT NULL,
    roles character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted boolean DEFAULT false,
    deleted_at timestamp with time zone,
    scim_external_id character varying(255),
    scim_managed boolean DEFAULT false,
    scim_user_name character varying(255),
    scim_meta text
);


ALTER TABLE public.nc_org_users OWNER TO diversified;

--
-- Name: nc_permission_subjects; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_permission_subjects (
    fk_permission_id character varying(20) NOT NULL,
    subject_type character varying(255) NOT NULL,
    subject_id character varying(255) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    hierarchy_scope character varying(30)
);


ALTER TABLE public.nc_permission_subjects OWNER TO diversified;

--
-- Name: nc_permissions; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_permissions (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    entity character varying(255),
    entity_id character varying(255),
    permission character varying(255),
    created_by character varying(20),
    enforce_for_form boolean DEFAULT true,
    enforce_for_automation boolean DEFAULT true,
    granted_type character varying(255),
    granted_role character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_permissions OWNER TO diversified;

--
-- Name: nc_plans; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_plans (
    id character varying(20) NOT NULL,
    title character varying(255),
    description text,
    stripe_product_id character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    prices text,
    meta text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_plans OWNER TO diversified;

--
-- Name: nc_plugins_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_plugins_v2 (
    id character varying(20) NOT NULL,
    title character varying(45),
    description text,
    active boolean DEFAULT false,
    rating real,
    version character varying(255),
    docs character varying(255),
    status character varying(255) DEFAULT 'install'::character varying,
    status_details character varying(255),
    logo character varying(255),
    icon character varying(255),
    tags character varying(255),
    category character varying(255),
    input_schema text,
    input text,
    creator character varying(255),
    creator_website character varying(255),
    price character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_plugins_v2 OWNER TO diversified;

--
-- Name: nc_principal_assignments; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_principal_assignments (
    resource_type character varying(20) NOT NULL,
    resource_id character varying(20) NOT NULL,
    principal_type character varying(20) NOT NULL,
    principal_ref_id character varying(20) NOT NULL,
    roles character varying(255) NOT NULL,
    deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_principal_assignments OWNER TO diversified;

--
-- Name: nc_record_templates; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_record_templates (
    id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    fk_model_id character varying(20) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    template_data text NOT NULL,
    usage_count integer DEFAULT 0,
    enabled boolean DEFAULT true,
    created_by character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_record_templates OWNER TO diversified;

--
-- Name: nc_rls_policies; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_rls_policies (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    source_id character varying(20),
    fk_model_id character varying(20) NOT NULL,
    title character varying(255),
    enabled boolean DEFAULT true,
    is_default boolean DEFAULT false,
    default_behavior character varying(20),
    "order" real,
    meta text,
    created_by character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_rls_policies OWNER TO diversified;

--
-- Name: nc_rls_policy_subjects; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_rls_policy_subjects (
    fk_rls_policy_id character varying(20) NOT NULL,
    subject_type character varying(255) NOT NULL,
    subject_id character varying(255) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    hierarchy_scope character varying(30)
);


ALTER TABLE public.nc_rls_policy_subjects OWNER TO diversified;

--
-- Name: nc_row_color_conditions; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_row_color_conditions (
    id character varying(20) NOT NULL,
    fk_view_id character varying(20),
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    color character varying(20),
    nc_order real,
    is_set_as_background boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type character varying(20) DEFAULT 'row'::character varying,
    fk_target_column_id character varying(20)
);


ALTER TABLE public.nc_row_color_conditions OWNER TO diversified;

--
-- Name: nc_sandbox_changelog; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_sandbox_changelog (
    id character varying(20) NOT NULL,
    seq bigint NOT NULL,
    fk_sandbox_id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    event character varying(80) NOT NULL,
    entity_type character varying(40) NOT NULL,
    entity_id character varying(20),
    entity_title character varying(255),
    parent_entity_id character varying(20),
    parent_entity_title character varying(255),
    created_by character varying(20) NOT NULL,
    description text,
    meta text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    merged_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_sandbox_changelog OWNER TO diversified;

--
-- Name: nc_sandboxes_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_sandboxes_v2 (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20) NOT NULL,
    production_base_id character varying(20) NOT NULL,
    sandbox_base_id character varying(20) NOT NULL,
    created_by character varying(20) NOT NULL,
    meta text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_sandboxes_v2 OWNER TO diversified;

--
-- Name: nc_scim_config; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_scim_config (
    id character varying(20) NOT NULL,
    enabled boolean DEFAULT false,
    provisioning_token text NOT NULL,
    role_mapping text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    default_role character varying(50) DEFAULT 'no-access'::character varying,
    fk_org_id character varying(20)
);


ALTER TABLE public.nc_scim_config OWNER TO diversified;

--
-- Name: nc_scripts; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_scripts (
    id character varying(20) NOT NULL,
    title text,
    description text,
    meta text,
    "order" real,
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    script text,
    config text,
    created_by character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_scripts OWNER TO diversified;

--
-- Name: nc_snapshots; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_snapshots (
    id character varying(20) NOT NULL,
    title character varying(512),
    base_id character varying(20),
    snapshot_base_id character varying(20),
    fk_workspace_id character varying(20),
    created_by character varying(20),
    status character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_snapshots OWNER TO diversified;

--
-- Name: nc_sort_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_sort_v2 (
    id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_view_id character varying(20),
    fk_column_id character varying(20),
    direction character varying(255) DEFAULT 'false'::character varying,
    "order" real,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_level_id character varying(20)
);


ALTER TABLE public.nc_sort_v2 OWNER TO diversified;

--
-- Name: nc_sources_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_sources_v2 (
    id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    alias character varying(255),
    config text,
    meta text,
    is_meta boolean,
    type character varying(255),
    inflection_column character varying(255),
    inflection_table character varying(255),
    enabled boolean DEFAULT true,
    "order" real,
    description character varying(255),
    erd_uuid character varying(255),
    deleted boolean DEFAULT false,
    is_schema_readonly boolean DEFAULT false,
    is_data_readonly boolean DEFAULT false,
    is_local boolean DEFAULT false,
    fk_sql_executor_id character varying(20),
    fk_workspace_id character varying(20),
    fk_integration_id character varying(20),
    is_encrypted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_sources_v2 OWNER TO diversified;

--
-- Name: nc_sql_executor_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_sql_executor_v2 (
    id character varying(20) NOT NULL,
    domain character varying(50),
    status character varying(20),
    priority integer,
    capacity integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_sql_executor_v2 OWNER TO diversified;

--
-- Name: nc_sso_client; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_sso_client (
    id character varying(20) NOT NULL,
    type character varying(20),
    title character varying(255),
    enabled boolean DEFAULT true,
    config text,
    fk_user_id character varying(20),
    fk_org_id character varying(20),
    deleted boolean DEFAULT false,
    "order" real,
    domain_name character varying(255),
    domain_name_verified boolean,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_sso_client OWNER TO diversified;

--
-- Name: nc_sso_client_domain; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_sso_client_domain (
    fk_sso_client_id character varying(20) NOT NULL,
    fk_org_domain_id character varying(20),
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_sso_client_domain OWNER TO diversified;

--
-- Name: nc_store; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_store (
    id integer NOT NULL,
    base_id character varying(255),
    db_alias character varying(255) DEFAULT 'db'::character varying,
    key character varying(255),
    value text,
    type character varying(255),
    env character varying(255),
    tag character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.nc_store OWNER TO diversified;

--
-- Name: nc_store_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.nc_store_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.nc_store_id_seq OWNER TO diversified;

--
-- Name: nc_store_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.nc_store_id_seq OWNED BY public.nc_store.id;


--
-- Name: nc_subscriptions; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_subscriptions (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    fk_org_id character varying(20),
    fk_plan_id character varying(20) NOT NULL,
    fk_user_id character varying(20),
    stripe_subscription_id character varying(255),
    stripe_price_id character varying(255),
    seat_count integer DEFAULT 1 NOT NULL,
    status character varying(255),
    billing_cycle_anchor timestamp with time zone,
    start_at timestamp with time zone,
    trial_end_at timestamp with time zone,
    canceled_at timestamp with time zone,
    period character varying(255),
    upcoming_invoice_at timestamp with time zone,
    upcoming_invoice_due_at timestamp with time zone,
    upcoming_invoice_amount integer,
    upcoming_invoice_currency character varying(255),
    stripe_schedule_id character varying(255),
    schedule_phase_start timestamp with time zone,
    schedule_stripe_price_id character varying(255),
    schedule_fk_plan_id character varying(20),
    schedule_period character varying(255),
    schedule_type character varying(255),
    meta text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_paid_seat_count integer
);


ALTER TABLE public.nc_subscriptions OWNER TO diversified;

--
-- Name: nc_sync_configs; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_sync_configs (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_integration_id character varying(20),
    fk_model_id character varying(20),
    sync_type character varying(255),
    sync_trigger character varying(255),
    sync_trigger_cron character varying(255),
    sync_trigger_secret character varying(255),
    sync_job_id character varying(255),
    last_sync_at timestamp with time zone,
    next_sync_at timestamp with time zone,
    title character varying(255),
    sync_category character varying(255),
    fk_parent_sync_config_id character varying(20),
    on_delete_action character varying(255) DEFAULT 'mark_deleted'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(20),
    updated_by character varying(20),
    meta text
);


ALTER TABLE public.nc_sync_configs OWNER TO diversified;

--
-- Name: nc_sync_logs_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_sync_logs_v2 (
    id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    fk_sync_source_id character varying(20),
    time_taken integer,
    status character varying(255),
    status_details text,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_sync_logs_v2 OWNER TO diversified;

--
-- Name: nc_sync_mappings; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_sync_mappings (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_sync_config_id character varying(20),
    target_table character varying(255),
    fk_model_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_sync_mappings OWNER TO diversified;

--
-- Name: nc_sync_source_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_sync_source_v2 (
    id character varying(20) NOT NULL,
    title character varying(255),
    type character varying(255),
    details text,
    deleted boolean,
    enabled boolean DEFAULT true,
    "order" real,
    base_id character varying(20) NOT NULL,
    fk_user_id character varying(20),
    source_id character varying(20),
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_sync_source_v2 OWNER TO diversified;

--
-- Name: nc_teams; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_teams (
    id character varying(20) NOT NULL,
    title character varying(255) NOT NULL,
    meta text,
    fk_org_id character varying(20),
    fk_workspace_id character varying(20),
    created_by character varying(20),
    deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    scim_external_id character varying(255),
    scim_managed boolean DEFAULT false,
    scim_display_name character varying(255),
    scim_meta text,
    fk_parent_team_id character varying(20),
    depth integer DEFAULT 0,
    path text
);


ALTER TABLE public.nc_teams OWNER TO diversified;

--
-- Name: nc_timeline_view_columns_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_timeline_view_columns_v2 (
    id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    source_id character varying(20),
    fk_view_id character varying(20),
    fk_column_id character varying(20),
    show boolean,
    bold boolean,
    underline boolean,
    italic boolean,
    "order" real,
    group_by boolean,
    group_by_order real,
    group_by_sort character varying(4),
    aggregation character varying(20),
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_timeline_view_columns_v2 OWNER TO diversified;

--
-- Name: nc_timeline_view_range_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_timeline_view_range_v2 (
    id character varying(20) NOT NULL,
    fk_view_id character varying(20),
    fk_from_column_id character varying(20),
    fk_to_column_id character varying(20),
    label character varying(40),
    base_id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_timeline_view_range_v2 OWNER TO diversified;

--
-- Name: nc_timeline_view_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_timeline_view_v2 (
    fk_view_id character varying(20) NOT NULL,
    base_id character varying(20) NOT NULL,
    source_id character varying(20),
    title character varying(255),
    meta text,
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_timeline_view_v2 OWNER TO diversified;

--
-- Name: nc_trash; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_trash (
    id character varying(20) NOT NULL,
    name character varying(255),
    parent_name character varying(255),
    resource_type character varying(255),
    resource_id character varying(255),
    parent_type character varying(255),
    parent_id character varying(20),
    deleted_by character varying(20),
    deleted_at timestamp with time zone,
    cleanup_due_at timestamp with time zone,
    related_items text,
    meta text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL
);


ALTER TABLE public.nc_trash OWNER TO diversified;

--
-- Name: nc_usage_stats; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_usage_stats (
    fk_workspace_id character varying(20) NOT NULL,
    usage_type character varying(255) NOT NULL,
    period_start timestamp with time zone NOT NULL,
    count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_usage_stats OWNER TO diversified;

--
-- Name: nc_user_comment_notifications_preference; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_user_comment_notifications_preference (
    id character varying(20) NOT NULL,
    row_id character varying(255),
    user_id character varying(20),
    fk_model_id character varying(20),
    source_id character varying(20),
    base_id character varying(20),
    preferences character varying(255),
    fk_workspace_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_user_comment_notifications_preference OWNER TO diversified;

--
-- Name: nc_user_refresh_tokens; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_user_refresh_tokens (
    fk_user_id character varying(20),
    token character varying(255),
    meta text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_user_refresh_tokens OWNER TO diversified;

--
-- Name: nc_users_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_users_v2 (
    id character varying(20) NOT NULL,
    email character varying(255),
    password character varying(255),
    salt character varying(255),
    invite_token character varying(255),
    invite_token_expires character varying(255),
    reset_password_expires timestamp with time zone,
    reset_password_token character varying(255),
    email_verification_token character varying(255),
    email_verified boolean,
    roles character varying(255) DEFAULT 'editor'::character varying,
    token_version character varying(255),
    blocked boolean DEFAULT false,
    blocked_reason character varying(255),
    deleted_at timestamp with time zone,
    is_deleted boolean DEFAULT false,
    meta text,
    display_name character varying(255),
    user_name character varying(255),
    bio character varying(255),
    location character varying(255),
    website character varying(255),
    avatar character varying(255),
    is_new_user boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    canonical_email character varying(255),
    stripe_customer_id character varying(255),
    totp_secret text,
    totp_enabled boolean DEFAULT false,
    totp_backup_codes text
);


ALTER TABLE public.nc_users_v2 OWNER TO diversified;

--
-- Name: nc_view_sections; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_view_sections (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20),
    source_id character varying(20),
    fk_model_id character varying(20) NOT NULL,
    title character varying(255) NOT NULL,
    "order" real,
    meta text,
    created_by character varying(20),
    updated_by character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nc_view_sections OWNER TO diversified;

--
-- Name: nc_views_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_views_v2 (
    id character varying(20) NOT NULL,
    source_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_model_id character varying(20),
    title character varying(255),
    type integer,
    is_default boolean,
    show_system_fields boolean,
    lock_type character varying(255) DEFAULT 'collaborative'::character varying,
    uuid character varying(255),
    password character varying(255),
    show boolean,
    "order" real,
    meta text,
    description text,
    created_by character varying(20),
    owned_by character varying(20),
    fk_workspace_id character varying(20),
    attachment_mode_column_id character varying(20),
    expanded_record_mode character varying(255),
    fk_custom_url_id character varying(20),
    row_coloring_mode character varying(10),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fk_view_section_id character varying(20),
    deleted boolean
);


ALTER TABLE public.nc_views_v2 OWNER TO diversified;

--
-- Name: nc_widgets_v2; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_widgets_v2 (
    id character varying(20) NOT NULL,
    fk_workspace_id character varying(20),
    base_id character varying(20) NOT NULL,
    fk_dashboard_id character varying(20) NOT NULL,
    fk_model_id character varying(20),
    fk_view_id character varying(20),
    title character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    config text,
    meta text,
    "order" integer,
    "position" text,
    error boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted boolean
);


ALTER TABLE public.nc_widgets_v2 OWNER TO diversified;

--
-- Name: nc_workflows; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.nc_workflows (
    id character varying(20) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    fk_workspace_id character varying(20),
    base_id character varying(20),
    enabled boolean DEFAULT false,
    nodes text,
    edges text,
    meta text,
    "order" real,
    created_by character varying(20),
    updated_by character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    draft text
);


ALTER TABLE public.nc_workflows OWNER TO diversified;

--
-- Name: notification; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.notification (
    id character varying(20) NOT NULL,
    type character varying(40),
    body text,
    is_read boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    fk_user_id character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notification OWNER TO diversified;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    type text NOT NULL,
    title text NOT NULL,
    body text,
    link text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone
);


ALTER TABLE public.notifications OWNER TO diversified;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO diversified;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: outlook_calendar_events_cache; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.outlook_calendar_events_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    connection_id uuid,
    user_id integer NOT NULL,
    outlook_event_id text NOT NULL,
    subject text,
    body_preview text,
    organizer_name text,
    organizer_email text,
    location text,
    web_link text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    is_all_day boolean DEFAULT false,
    response_status text,
    raw jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.outlook_calendar_events_cache OWNER TO diversified;

--
-- Name: requests; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.requests (
    id integer NOT NULL,
    request_id text,
    title text NOT NULL,
    requester text NOT NULL,
    category text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    status text DEFAULT 'submitted'::text NOT NULL,
    description text,
    assigned_reviewer text,
    submitted_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    linked_form_id text,
    linked_task_id integer,
    request_number text,
    assignee uuid,
    updated_by integer,
    CONSTRAINT requests_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT requests_status_check CHECK ((status = ANY (ARRAY['submitted'::text, 'under_review'::text, 'approved'::text, 'denied'::text, 'completed'::text])))
);


ALTER TABLE public.requests OWNER TO diversified;

--
-- Name: requests_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.requests_id_seq OWNER TO diversified;

--
-- Name: requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.requests_id_seq OWNED BY public.requests.id;


--
-- Name: sop_approvals; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.sop_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sop_run_id uuid NOT NULL,
    sop_step_id integer NOT NULL,
    requested_by integer NOT NULL,
    approver_id integer,
    status text DEFAULT 'pending'::text NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    CONSTRAINT sop_approvals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.sop_approvals OWNER TO diversified;

--
-- Name: sop_run_steps; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.sop_run_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sop_run_id uuid NOT NULL,
    sop_step_id integer NOT NULL,
    step_order integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    evidence_url text,
    completed_by integer,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sop_run_steps_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'waiting'::text, 'blocked'::text, 'completed'::text, 'skipped'::text]))),
    CONSTRAINT sop_run_steps_step_order_positive CHECK ((step_order > 0))
);


ALTER TABLE public.sop_run_steps OWNER TO diversified;

--
-- Name: sop_runs; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.sop_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sop_id integer NOT NULL,
    assigned_to integer,
    started_by integer NOT NULL,
    current_step_id integer,
    status text DEFAULT 'running'::text NOT NULL,
    state_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    wait_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    blocked_reason text,
    revision integer DEFAULT 1 NOT NULL,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sop_runs_revision_positive CHECK ((revision > 0)),
    CONSTRAINT sop_runs_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'running'::text, 'waiting'::text, 'blocked'::text, 'completed'::text, 'failed'::text, 'canceled'::text])))
);


ALTER TABLE public.sop_runs OWNER TO diversified;

--
-- Name: sop_steps; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.sop_steps (
    id integer NOT NULL,
    sop_id integer NOT NULL,
    step_order integer NOT NULL,
    title text NOT NULL,
    instructions text,
    required_role text,
    requires_evidence boolean DEFAULT false NOT NULL,
    requires_approval boolean DEFAULT false NOT NULL,
    estimated_minutes integer,
    branch_condition jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sop_steps_estimated_minutes_positive CHECK (((estimated_minutes IS NULL) OR (estimated_minutes > 0))),
    CONSTRAINT sop_steps_step_order_positive CHECK ((step_order > 0))
);


ALTER TABLE public.sop_steps OWNER TO diversified;

--
-- Name: sop_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.sop_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sop_steps_id_seq OWNER TO diversified;

--
-- Name: sop_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.sop_steps_id_seq OWNED BY public.sop_steps.id;


--
-- Name: sops; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.sops (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(100),
    owner integer,
    status character varying(50) DEFAULT 'active'::character varying,
    content text,
    version character varying(20) DEFAULT '1.0'::character varying,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    department text,
    created_by integer,
    updated_at timestamp with time zone DEFAULT now(),
    description text
);


ALTER TABLE public.sops OWNER TO diversified;

--
-- Name: sops_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.sops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sops_id_seq OWNER TO diversified;

--
-- Name: sops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.sops_id_seq OWNED BY public.sops.id;


--
-- Name: system_audit_logs; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.system_audit_logs (
    id bigint NOT NULL,
    actor_user_id uuid,
    action text NOT NULL,
    module text NOT NULL,
    record_id text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_audit_logs OWNER TO diversified;

--
-- Name: system_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.system_audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_audit_logs_id_seq OWNER TO diversified;

--
-- Name: system_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.system_audit_logs_id_seq OWNED BY public.system_audit_logs.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.system_settings (
    id bigint NOT NULL,
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    category text NOT NULL,
    description text,
    is_public boolean DEFAULT false NOT NULL,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_settings OWNER TO diversified;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.system_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_settings_id_seq OWNER TO diversified;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'todo'::character varying,
    priority character varying(50) DEFAULT 'medium'::character varying,
    assigned_to integer,
    due_date date,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    division text DEFAULT 'Diversified'::text,
    topic text,
    notes text,
    start_date date,
    start_time text DEFAULT '09:00'::text,
    end_time text DEFAULT '10:00'::text,
    all_day boolean DEFAULT false,
    repeat_schedule text DEFAULT 'None'::text,
    estimated_hours integer DEFAULT 0,
    estimated_minutes integer DEFAULT 0,
    is_private boolean DEFAULT false,
    locked boolean DEFAULT false
);


ALTER TABLE public.tasks OWNER TO diversified;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tasks_id_seq OWNER TO diversified;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: timeclock_entries; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.timeclock_entries (
    id integer NOT NULL,
    employee_id integer,
    employee_name text NOT NULL,
    clock_in timestamp with time zone DEFAULT now() NOT NULL,
    clock_out timestamp with time zone,
    total_minutes integer GENERATED ALWAYS AS (
CASE
    WHEN (clock_out IS NOT NULL) THEN ((EXTRACT(epoch FROM (clock_out - clock_in)))::integer / 60)
    ELSE NULL::integer
END) STORED,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.timeclock_entries OWNER TO diversified;

--
-- Name: timeclock_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.timeclock_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.timeclock_entries_id_seq OWNER TO diversified;

--
-- Name: timeclock_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.timeclock_entries_id_seq OWNED BY public.timeclock_entries.id;


--
-- Name: timesheets; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.timesheets (
    id integer NOT NULL,
    employee_id integer,
    employee_name text NOT NULL,
    week_start date NOT NULL,
    week_end date NOT NULL,
    monday_hours numeric(4,2) DEFAULT 0,
    tuesday_hours numeric(4,2) DEFAULT 0,
    wednesday_hours numeric(4,2) DEFAULT 0,
    thursday_hours numeric(4,2) DEFAULT 0,
    friday_hours numeric(4,2) DEFAULT 0,
    saturday_hours numeric(4,2) DEFAULT 0,
    sunday_hours numeric(4,2) DEFAULT 0,
    total_hours numeric(6,2) GENERATED ALWAYS AS (((((((monday_hours + tuesday_hours) + wednesday_hours) + thursday_hours) + friday_hours) + saturday_hours) + sunday_hours)) STORED,
    status text DEFAULT 'draft'::text NOT NULL,
    submitted_at timestamp with time zone,
    approved_by text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT timesheets_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.timesheets OWNER TO diversified;

--
-- Name: timesheets_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.timesheets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.timesheets_id_seq OWNER TO diversified;

--
-- Name: timesheets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.timesheets_id_seq OWNED BY public.timesheets.id;


--
-- Name: work_orders; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.work_orders (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type character varying(100),
    status character varying(50) DEFAULT 'open'::character varying,
    priority character varying(50) DEFAULT 'medium'::character varying,
    owner integer,
    due_date date,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    division text DEFAULT 'Operations'::text NOT NULL,
    notes text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by integer,
    updated_by integer,
    CONSTRAINT work_orders_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT work_orders_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'scheduled'::character varying, 'in_progress'::character varying, 'waiting'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.work_orders OWNER TO diversified;

--
-- Name: work_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.work_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.work_orders_id_seq OWNER TO diversified;

--
-- Name: work_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.work_orders_id_seq OWNED BY public.work_orders.id;


--
-- Name: workspace; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.workspace (
    id character varying(20) NOT NULL,
    title character varying(255),
    description text,
    meta text,
    fk_user_id character varying(20),
    deleted boolean DEFAULT false,
    deleted_at timestamp with time zone,
    "order" real,
    status smallint DEFAULT '0'::smallint,
    message character varying(256),
    plan character varying(20) DEFAULT 'free'::character varying,
    infra_meta text,
    fk_org_id character varying(20),
    stripe_customer_id character varying(255),
    grace_period_start_at timestamp with time zone,
    api_grace_period_start_at timestamp with time zone,
    automation_grace_period_start_at timestamp with time zone,
    loyal boolean DEFAULT false,
    loyalty_discount_used boolean DEFAULT false,
    db_job_id character varying(20),
    fk_db_instance_id character varying(20),
    segment_code integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.workspace OWNER TO diversified;

--
-- Name: workspace_user; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.workspace_user (
    fk_workspace_id character varying(20) NOT NULL,
    fk_user_id character varying(20) NOT NULL,
    roles character varying(255),
    invite_token character varying(255),
    invite_accepted boolean DEFAULT false,
    deleted boolean DEFAULT false,
    deleted_at timestamp with time zone,
    "order" real,
    invited_by character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    scim_external_id character varying(255),
    scim_managed boolean DEFAULT false,
    scim_user_name character varying(255),
    scim_meta text
);


ALTER TABLE public.workspace_user OWNER TO diversified;

--
-- Name: xc_knex_migrationsv0; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.xc_knex_migrationsv0 (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.xc_knex_migrationsv0 OWNER TO diversified;

--
-- Name: xc_knex_migrationsv0_id_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.xc_knex_migrationsv0_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.xc_knex_migrationsv0_id_seq OWNER TO diversified;

--
-- Name: xc_knex_migrationsv0_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.xc_knex_migrationsv0_id_seq OWNED BY public.xc_knex_migrationsv0.id;


--
-- Name: xc_knex_migrationsv0_lock; Type: TABLE; Schema: public; Owner: diversified
--

CREATE TABLE public.xc_knex_migrationsv0_lock (
    index integer NOT NULL,
    is_locked integer
);


ALTER TABLE public.xc_knex_migrationsv0_lock OWNER TO diversified;

--
-- Name: xc_knex_migrationsv0_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: diversified
--

CREATE SEQUENCE public.xc_knex_migrationsv0_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.xc_knex_migrationsv0_lock_index_seq OWNER TO diversified;

--
-- Name: xc_knex_migrationsv0_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: diversified
--

ALTER SEQUENCE public.xc_knex_migrationsv0_lock_index_seq OWNED BY public.xc_knex_migrationsv0_lock.index;


--
-- Name: Features id; Type: DEFAULT; Schema: pdino8tpcml3eup; Owner: diversified
--

ALTER TABLE ONLY pdino8tpcml3eup."Features" ALTER COLUMN id SET DEFAULT nextval('pdino8tpcml3eup."Features_id_seq"'::regclass);


--
-- Name: document_audit_logs id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.document_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.document_audit_logs_id_seq'::regclass);


--
-- Name: document_signatures id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.document_signatures ALTER COLUMN id SET DEFAULT nextval('public.document_signatures_id_seq'::regclass);


--
-- Name: document_versions id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.document_versions ALTER COLUMN id SET DEFAULT nextval('public.document_versions_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: file_records id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.file_records ALTER COLUMN id SET DEFAULT nextval('public.file_records_id_seq'::regclass);


--
-- Name: forms id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.forms ALTER COLUMN id SET DEFAULT nextval('public.forms_id_seq'::regclass);


--
-- Name: inventory id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);


--
-- Name: nc_api_tokens id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_api_tokens ALTER COLUMN id SET DEFAULT nextval('public.nc_api_tokens_id_seq'::regclass);


--
-- Name: nc_store id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_store ALTER COLUMN id SET DEFAULT nextval('public.nc_store_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: requests id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.requests ALTER COLUMN id SET DEFAULT nextval('public.requests_id_seq'::regclass);


--
-- Name: sop_steps id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_steps ALTER COLUMN id SET DEFAULT nextval('public.sop_steps_id_seq'::regclass);


--
-- Name: sops id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sops ALTER COLUMN id SET DEFAULT nextval('public.sops_id_seq'::regclass);


--
-- Name: system_audit_logs id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.system_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.system_audit_logs_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: timeclock_entries id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.timeclock_entries ALTER COLUMN id SET DEFAULT nextval('public.timeclock_entries_id_seq'::regclass);


--
-- Name: timesheets id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.timesheets ALTER COLUMN id SET DEFAULT nextval('public.timesheets_id_seq'::regclass);


--
-- Name: work_orders id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.work_orders ALTER COLUMN id SET DEFAULT nextval('public.work_orders_id_seq'::regclass);


--
-- Name: xc_knex_migrationsv0 id; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.xc_knex_migrationsv0 ALTER COLUMN id SET DEFAULT nextval('public.xc_knex_migrationsv0_id_seq'::regclass);


--
-- Name: xc_knex_migrationsv0_lock index; Type: DEFAULT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.xc_knex_migrationsv0_lock ALTER COLUMN index SET DEFAULT nextval('public.xc_knex_migrationsv0_lock_index_seq'::regclass);


--
-- Data for Name: Features; Type: TABLE DATA; Schema: pdino8tpcml3eup; Owner: diversified
--

COPY pdino8tpcml3eup."Features" (id, created_at, updated_at, created_by, updated_by, nc_order, __nc_deleted, nc_row_meta, title) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.audit_logs (id, actor_user_id, action, module, entity_type, entity_id, before_data, after_data, ip_address, user_agent, created_at, actor_user_id_text, entity_id_text) FROM stdin;
032a9c1a-5f46-4b4b-bf27-5b94a90f7204	\N	task.updated	tasks	task	\N	{"id": 21, "notes": null, "title": "Fleet Maintenance Schedule", "topic": null, "locked": false, "status": "todo", "all_day": false, "division": "Diversified", "due_date": "2026-05-18T00:00:00.000Z", "end_time": "10:00", "priority": "medium", "created_at": "2026-05-10T04:11:52.290Z", "is_private": false, "start_date": "2026-05-18T00:00:00.000Z", "start_time": "09:00", "assigned_to": 8, "description": "Create preventive maintenance schedule for all company vehicles", "completed_at": null, "estimated_hours": 0, "repeat_schedule": "None", "assigned_to_name": "Jordan Strasser", "estimated_minutes": 0, "assigned_department": "Operations"}	{"id": 21, "notes": null, "title": "Fleet Maintenance Schedule", "topic": null, "locked": true, "status": "todo", "all_day": false, "division": "Diversified", "due_date": "2026-05-18T00:00:00.000Z", "end_time": "10:00", "priority": "medium", "created_at": "2026-05-10T04:11:52.290Z", "is_private": false, "start_date": "2026-05-18T00:00:00.000Z", "start_time": "09:00", "assigned_to": 8, "description": "Create preventive maintenance schedule for all company vehicles", "completed_at": null, "estimated_hours": 0, "repeat_schedule": "None", "assigned_to_name": "Jordan Strasser", "estimated_minutes": 0, "assigned_department": "Operations"}	::ffff:127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1	2026-05-14 08:51:12.42481+00	12	21
68f31df1-e4cd-4c2e-83a1-57db14128e43	\N	setting.updated	settings	system_setting	\N	null	{"id": "1", "key": "notification_preferences", "value": {"task_overdue": {"sms": false, "email": true, "inApp": true}, "low_inventory": {"sms": false, "email": true, "inApp": true}, "task_assigned": {"sms": false, "email": true, "inApp": true}, "form_submitted": {"sms": false, "email": true, "inApp": true}, "request_submitted": {"sms": false, "email": true, "inApp": true}, "timesheet_submitted": {"sms": false, "email": true, "inApp": true}, "work_order_assigned": {"sms": false, "email": true, "inApp": true}, "weekly_leadership_summary": {"sms": false, "email": true, "inApp": true}, "request_approved_or_denied": {"sms": false, "email": true, "inApp": true}}, "category": "notifications", "is_public": false, "created_at": "2026-05-13T01:26:29.005Z", "updated_at": "2026-05-14T08:52:11.840Z", "description": "Internal notification channel preferences for operations events."}	::ffff:127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1	2026-05-14 08:52:11.852815+00	12	notification_preferences
76d64e1a-4cea-4445-b85c-f33baeef2c09	\N	task.updated	tasks	task	\N	{"id": 35, "notes": null, "title": "S.O.P. needed for the new hires.", "topic": null, "locked": false, "status": "todo", "all_day": false, "division": "Diversified", "due_date": "2026-05-14T00:00:00.000Z", "end_time": "10:00", "priority": "medium", "created_at": "2026-05-12T18:30:08.162Z", "is_private": false, "start_date": "2026-05-11T00:00:00.000Z", "start_time": "09:00", "assigned_to": 10, "description": null, "completed_at": null, "estimated_hours": 0, "repeat_schedule": "None", "assigned_to_name": "Jill Strasser", "estimated_minutes": 0, "assigned_department": "Human Resources"}	{"id": 35, "notes": null, "title": "S.O.P. needed for the new hires.", "topic": null, "locked": false, "status": "todo", "all_day": false, "division": "Diversified", "due_date": "2026-05-14T00:00:00.000Z", "end_time": "13:00", "priority": "medium", "created_at": "2026-05-12T18:30:08.162Z", "is_private": false, "start_date": "2026-05-11T00:00:00.000Z", "start_time": "12:00", "assigned_to": 10, "description": null, "completed_at": null, "estimated_hours": 0, "repeat_schedule": "None", "assigned_to_name": "Jill Strasser", "estimated_minutes": 0, "assigned_department": "Human Resources"}	::ffff:127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 26_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/148.0.3967.55 Version/26.0 Mobile/15E148 Safari/604.1	2026-05-14 09:46:02.511599+00	12	35
5fc48a5e-7f60-4ada-94c2-0bf56c39807b	\N	task.updated	tasks	task	\N	{"id": 25, "notes": null, "title": "Spencer 2PM", "topic": "Client", "locked": false, "status": "todo", "all_day": false, "division": "Operations", "due_date": "2026-05-11T00:00:00.000Z", "end_time": "15:00", "priority": "medium", "created_at": "2026-05-10T20:29:01.793Z", "is_private": false, "start_date": "2026-05-11T00:00:00.000Z", "start_time": "14:00", "assigned_to": 3, "description": "Spencer client follow-up call", "completed_at": null, "estimated_hours": 1, "repeat_schedule": "None", "assigned_to_name": "Carlos Mendez", "estimated_minutes": 0, "assigned_department": "Logistics"}	{"id": 25, "notes": null, "title": "Spencer 2PM", "topic": "Client", "locked": false, "status": "todo", "all_day": false, "division": "Operations", "due_date": "2026-05-11T00:00:00.000Z", "end_time": "12:00", "priority": "medium", "created_at": "2026-05-10T20:29:01.793Z", "is_private": false, "start_date": "2026-05-11T00:00:00.000Z", "start_time": "11:00", "assigned_to": 3, "description": "Spencer client follow-up call", "completed_at": null, "estimated_hours": 1, "repeat_schedule": "None", "assigned_to_name": "Carlos Mendez", "estimated_minutes": 0, "assigned_department": "Logistics"}	::ffff:127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 26_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/148.0.3967.55 Version/26.0 Mobile/15E148 Safari/604.1	2026-05-14 09:46:07.714453+00	12	25
7f9fcb83-ad14-45f1-a4c1-a43d232d823f	\N	inventory.updated	inventory	inventory_item	\N	{"id": 9, "unit": "units", "status": "in_stock", "category": "Equipment", "location": "Warehouse A - Shelf 5", "quantity": 7, "item_name": "Extension Cord 50ft", "created_at": "2026-05-09T14:14:47.293Z", "last_updated": "2026-05-09T14:14:47.293Z", "reorder_threshold": 2}	{"id": 9, "unit": "units", "status": "in_stock", "category": "Equipment", "location": "Warehouse A - Shelf 5", "quantity": 8, "item_name": "Extension Cord 50ft", "created_at": "2026-05-09T14:14:47.293Z", "last_updated": "2026-05-09T14:14:47.293Z", "reorder_threshold": 2}	::ffff:127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 26_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/148.0.3967.55 Version/26.0 Mobile/15E148 Safari/604.1	2026-05-14 09:55:22.051533+00	12	9
45eb8220-7c0a-4341-b1cb-df6d6f437ff4	\N	sop.generated	sops	sop	\N	null	{"sop": {"id": 12, "owner": 13, "title": "Warranty Follow-Up Triage SOP", "status": "draft", "content": null, "version": "1.0", "category": "Office Procedures", "created_at": "2026-05-18T15:35:32.803Z", "created_by": 13, "department": "Operations", "updated_at": "2026-05-18T15:35:32.803Z", "description": "Standard procedure for initial triage of incoming warranty follow-up requests, ensuring consistent customer verification, work order validation, evidence collection, urgency classification, ownership assignment, and appropriate escalation of edge cases.", "last_updated": "2026-05-18T15:35:32.803Z"}, "steps": [{"id": 8, "title": "Confirm Customer Details", "sop_id": 12, "created_at": "2026-05-18T15:35:32.803Z", "step_order": 1, "updated_at": "2026-05-18T15:35:32.803Z", "instructions": "Collect and verify customer’s full name, service address, phone number, email, and original installation date. Cross-reference with system records to ensure identity. If discrepancies exist, flag for manager review before proceeding.", "required_role": null, "branch_condition": null, "estimated_minutes": 5, "requires_approval": false, "requires_evidence": false}, {"id": 9, "title": "Verify Original Work Order", "sop_id": 12, "created_at": "2026-05-18T15:35:32.803Z", "step_order": 2, "updated_at": "2026-05-18T15:35:32.803Z", "instructions": "Retrieve the original work order and any prior service history. Confirm warranty coverage period, terms, and any exclusions. Document the work order number and coverage status in the triage log. If the warranty has expired or terms are unclear, prepare for escalation.", "required_role": null, "branch_condition": null, "estimated_minutes": 10, "requires_approval": false, "requires_evidence": true}, {"id": 10, "title": "Request and Collect Evidence/Photos", "sop_id": 12, "created_at": "2026-05-18T15:35:32.803Z", "step_order": 3, "updated_at": "2026-05-18T15:35:32.803Z", "instructions": "Instruct the customer to provide clear photos or videos of the reported issue, including wide-angle and close-up views, as well as any relevant context (e.g., door fully open/closed, visible damage). Provide a secure upload link or email. Verify that submitted evidence meets documentation standards before proceeding.", "required_role": null, "branch_condition": null, "estimated_minutes": 15, "requires_approval": false, "requires_evidence": true}, {"id": 11, "title": "Classify Urgency and Scope", "sop_id": 12, "created_at": "2026-05-18T15:35:32.803Z", "step_order": 4, "updated_at": "2026-05-18T15:35:32.803Z", "instructions": "Assess the reported issue against warranty coverage and internal risk matrix. Classify as Critical (safety hazard, inability to secure premises), High (major functional failure affecting daily use), Normal (minor functional or cosmetic), or Low (informational, no immediate action needed). For any Critical classification, immediate manager verification is required. Record classification rationale in the triage log.", "required_role": null, "branch_condition": null, "estimated_minutes": 10, "requires_approval": true, "requires_evidence": false}, {"id": 12, "title": "Assign Ownership", "sop_id": 12, "created_at": "2026-05-18T15:35:32.803Z", "step_order": 5, "updated_at": "2026-05-18T15:35:32.803Z", "instructions": "Assign the case to a qualified technician or service team based on urgency, skill requirements, and current workload. Update the dispatch board or internal system with the assigned owner and expected follow-up timeframe. Notify the assigned individual via standard communication channel.", "required_role": null, "branch_condition": null, "estimated_minutes": 10, "requires_approval": false, "requires_evidence": false}, {"id": 13, "title": "Escalate Edge Cases for Manager Review", "sop_id": 12, "created_at": "2026-05-18T15:35:32.803Z", "step_order": 6, "updated_at": "2026-05-18T15:35:32.803Z", "instructions": "Any case where warranty applicability is ambiguous, customer is actively dissatisfied, out-of-policy concessions are requested, or a Critical classification has been made must be escalated to a manager. Prepare a summary with work order details, evidence, classification, and proposed resolution. Manager review and signoff is required before further action.", "required_role": "Manager", "branch_condition": null, "estimated_minutes": 15, "requires_approval": true, "requires_evidence": true}, {"id": 14, "title": "Document and Log Triage Outcome", "sop_id": 12, "created_at": "2026-05-18T15:35:32.803Z", "step_order": 7, "updated_at": "2026-05-18T15:35:32.803Z", "instructions": "Record final triage outcome, next steps, assigned owner, and any manager approvals in the central system. Attach all collected evidence, customer communications, and work order references. Confirm that the case is properly flagged for follow-up according to urgency. This log serves as the audit trail for the entire triage process.", "required_role": null, "branch_condition": null, "estimated_minutes": 5, "requires_approval": false, "requires_evidence": true}]}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.120.0 Chrome/142.0.7444.265 Electron/39.8.8 Safari/537.36	2026-05-18 15:35:32.822322+00	13	12
4a3da9e0-8849-4f30-a309-d236fd58f78e	\N	task.updated	tasks	task	\N	{"id": 26, "notes": null, "title": "PNT Reorder", "topic": "Supplies", "locked": false, "status": "completed", "all_day": false, "division": "Purchasing", "due_date": "2026-05-11T00:00:00.000Z", "end_time": "16:30", "priority": "high", "created_at": "2026-05-10T20:29:01.793Z", "is_private": false, "start_date": "2026-05-11T00:00:00.000Z", "start_time": "16:00", "assigned_to": 1, "description": "Paint supply reorder approval needed", "completed_at": null, "estimated_hours": 0, "repeat_schedule": "None", "assigned_to_name": "Marcus Rivera", "estimated_minutes": 30, "assigned_department": "Operations"}	{"id": 26, "notes": null, "title": "PNT Reorder", "topic": "Supplies", "locked": false, "status": "completed", "all_day": false, "division": "Purchasing", "due_date": "2026-05-11T00:00:00.000Z", "end_time": "16:30", "priority": "high", "created_at": "2026-05-10T20:29:01.793Z", "is_private": false, "start_date": "2026-05-12T00:00:00.000Z", "start_time": "16:00", "assigned_to": 1, "description": "Paint supply reorder approval needed", "completed_at": null, "estimated_hours": 0, "repeat_schedule": "None", "assigned_to_name": "Marcus Rivera", "estimated_minutes": 30, "assigned_department": "Operations"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-14 19:18:08.802619+00	13	26
49b00b8a-b094-4829-b2cd-c465e241e18c	\N	task.updated	tasks	task	\N	{"id": 27, "notes": null, "title": "EOS Ad Options", "topic": "Advertising", "locked": false, "status": "todo", "all_day": false, "division": "Marketing", "due_date": "2026-05-12T00:00:00.000Z", "end_time": "14:00", "priority": "medium", "created_at": "2026-05-10T20:29:01.793Z", "is_private": false, "start_date": "2026-05-12T00:00:00.000Z", "start_time": "13:00", "assigned_to": 4, "description": "Review advertising options for EOS campaign", "completed_at": null, "estimated_hours": 1, "repeat_schedule": "None", "assigned_to_name": "Aisha Thompson", "estimated_minutes": 0, "assigned_department": "Administration"}	{"id": 27, "notes": null, "title": "EOS Ad Options", "topic": "Advertising", "locked": false, "status": "todo", "all_day": false, "division": "Marketing", "due_date": "2026-05-12T00:00:00.000Z", "end_time": "16:00", "priority": "medium", "created_at": "2026-05-10T20:29:01.793Z", "is_private": false, "start_date": "2026-05-11T00:00:00.000Z", "start_time": "15:00", "assigned_to": 4, "description": "Review advertising options for EOS campaign", "completed_at": null, "estimated_hours": 1, "repeat_schedule": "None", "assigned_to_name": "Aisha Thompson", "estimated_minutes": 0, "assigned_department": "Administration"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-14 19:18:11.384985+00	13	27
7155694e-97de-4c19-924b-14387d1fafbc	\N	task.updated	tasks	task	\N	{"id": 29, "notes": null, "title": "New FX Lawyers", "topic": "Legal", "locked": false, "status": "todo", "all_day": false, "division": "Legal", "due_date": "2026-05-13T00:00:00.000Z", "end_time": "14:30", "priority": "urgent", "created_at": "2026-05-10T20:29:01.793Z", "is_private": false, "start_date": "2026-05-13T00:00:00.000Z", "start_time": "13:00", "assigned_to": 2, "description": "Legal consultation re: FX contract terms", "completed_at": null, "estimated_hours": 1, "repeat_schedule": "None", "assigned_to_name": "Destiny Johnson", "estimated_minutes": 30, "assigned_department": "Operations"}	{"id": 29, "notes": null, "title": "New FX Lawyers", "topic": "Legal", "locked": false, "status": "todo", "all_day": false, "division": "Legal", "due_date": "2026-05-13T00:00:00.000Z", "end_time": "14:30", "priority": "urgent", "created_at": "2026-05-10T20:29:01.793Z", "is_private": false, "start_date": "2026-05-12T00:00:00.000Z", "start_time": "13:00", "assigned_to": 2, "description": "Legal consultation re: FX contract terms", "completed_at": null, "estimated_hours": 1, "repeat_schedule": "None", "assigned_to_name": "Destiny Johnson", "estimated_minutes": 30, "assigned_department": "Operations"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-14 19:18:13.07987+00	13	29
9cced41b-7235-42cc-8f80-f7d06e0bf37d	\N	sop.generated	sops	sop	\N	null	{"sop": {"id": 11, "owner": 13, "title": "Garage Door Warranty Call Intake", "status": "draft", "content": null, "version": "1.0", "category": "Customer Follow-Up", "created_at": "2026-05-18T12:45:31.382Z", "created_by": 13, "department": "Operations", "updated_at": "2026-05-18T12:45:31.382Z", "description": "Internal procedure for receiving and processing a warranty call, confirming customer/job details, reviewing work order history, collecting documentation, assigning follow-up, and escalating for manager approval when necessary.", "last_updated": "2026-05-18T12:45:31.382Z"}, "steps": [{"id": 1, "title": "Receive Warranty Call", "sop_id": 11, "created_at": "2026-05-18T12:45:31.382Z", "step_order": 1, "updated_at": "2026-05-18T12:45:31.382Z", "instructions": "Answer call promptly and identify the nature of the inquiry as warranty-related. Verify if this is a new issue or a follow-up. Record the caller’s full name, phone number, and a brief description of the problem. Politely set expectations that next steps will be communicated shortly.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 2, "requires_approval": false, "requires_evidence": false}, {"id": 2, "title": "Confirm Customer and Job Details", "sop_id": 11, "created_at": "2026-05-18T12:45:31.382Z", "step_order": 2, "updated_at": "2026-05-18T12:45:31.382Z", "instructions": "Retrieve the customer account using the provided phone number or name. Confirm the job address, original installation/service date, and warranty coverage terms. Note any exclusions or expired coverage. If coverage is uncertain, flag for manager review later.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 3, "requires_approval": false, "requires_evidence": false}, {"id": 3, "title": "Review Work Order History", "sop_id": 11, "created_at": "2026-05-18T12:45:31.382Z", "step_order": 3, "updated_at": "2026-05-18T12:45:31.382Z", "instructions": "Access prior work orders for the garage door or opener. Look for recurring issues, technician notes, parts replaced, and dates of service. Determine if the current problem may be related to previous work. Document findings in the call notes.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 3, "requires_approval": false, "requires_evidence": false}, {"id": 4, "title": "Request Photos or Video", "sop_id": 11, "created_at": "2026-05-18T12:45:31.382Z", "step_order": 4, "updated_at": "2026-05-18T12:45:31.382Z", "instructions": "If the issue is visually assessable (e.g., misalignment, damage, unusual noise), ask the customer to send clear photos or a short video to the designated department email or text number. Explain that this will speed up diagnosis and scheduling. Attach received media to the customer profile and note them in the call record.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 5, "requires_approval": false, "requires_evidence": true}, {"id": 5, "title": "Document and Assign Follow-Up Task", "sop_id": 11, "created_at": "2026-05-18T12:45:31.382Z", "step_order": 5, "updated_at": "2026-05-18T12:45:31.382Z", "instructions": "Create an internal follow-up task detailing the warranty concern, coverage status, work order history, and any attached media. Assign it to the dispatcher or service manager for scheduling a warranty inspection. Set a due date no later than the next business day.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 3, "requires_approval": false, "requires_evidence": false}, {"id": 6, "title": "Escalate for Manager Approval", "sop_id": 11, "created_at": "2026-05-18T12:45:31.382Z", "step_order": 6, "updated_at": "2026-05-18T12:45:31.382Z", "instructions": "When warranty coverage is unclear, work order history indicates possible customer abuse or non-covered issues, or the request falls outside standard terms, escalate the case to the Service Manager. Attach all relevant documentation and await written approval or denial before proceeding with scheduling.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 5, "requires_approval": true, "requires_evidence": false}, {"id": 7, "title": "Communicate Next Steps to Customer", "sop_id": 11, "created_at": "2026-05-18T12:45:31.382Z", "step_order": 7, "updated_at": "2026-05-18T12:45:31.382Z", "instructions": "After warranty status and scheduling plan are confirmed, contact the customer to explain the decision, next steps, and estimated time frame for the technician visit. If any non-covered charges may apply, disclose them at this stage. Record a summary of the conversation in the customer’s record.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 3, "requires_approval": false, "requires_evidence": false}]}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.120.0 Chrome/142.0.7444.265 Electron/39.8.8 Safari/537.36	2026-05-18 12:45:31.411281+00	13	11
b50afcb6-a8fd-4a43-a7a1-bb4f4e3d9059	\N	sop_run.started	sops	sop_run	39e429e8-2379-4272-b20a-e30a7fe9b9e2	null	{"id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "sop_id": 11, "status": "running", "revision": 1, "wait_json": {}, "started_at": "2026-05-18T12:46:26.907Z", "started_by": 13, "state_json": {}, "updated_at": "2026-05-18T12:46:26.907Z", "assigned_to": 13, "completed_at": null, "blocked_reason": null, "current_step_id": 1}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.120.0 Chrome/142.0.7444.265 Electron/39.8.8 Safari/537.36	2026-05-18 12:46:26.931612+00	13	39e429e8-2379-4272-b20a-e30a7fe9b9e2
20d1e552-8b18-4e31-926a-3a8eb820913b	\N	sop_run_step.completed	sops	sop_run	39e429e8-2379-4272-b20a-e30a7fe9b9e2	null	{"run": {"id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "sop_id": 11, "status": "running", "revision": 2, "wait_json": {}, "started_at": "2026-05-18T12:46:26.907Z", "started_by": 13, "state_json": {}, "updated_at": "2026-05-18T12:46:44.568Z", "assigned_to": 13, "completed_at": null, "blocked_reason": null, "current_step_id": 2}, "status": "advanced", "next_step_id": 2}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.120.0 Chrome/142.0.7444.265 Electron/39.8.8 Safari/537.36	2026-05-18 12:46:44.591276+00	13	39e429e8-2379-4272-b20a-e30a7fe9b9e2
44dcb363-80c3-4da6-ab84-f0c31259cf4e	\N	sop_run.blocked	sops	sop_run	39e429e8-2379-4272-b20a-e30a7fe9b9e2	{"id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "steps": [{"id": "6f037178-81e4-483a-a27a-8fa99e507d82", "notes": "Confirmed caller details and warranty concern.", "title": "Receive Warranty Call", "sop_id": 11, "status": "completed", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 1, "updated_at": "2026-05-18T12:46:44.568Z", "sop_step_id": 1, "completed_at": "2026-05-18T12:46:44.568Z", "completed_by": 13, "evidence_url": null, "instructions": "Answer call promptly and identify the nature of the inquiry as warranty-related. Verify if this is a new issue or a follow-up. Record the caller’s full name, phone number, and a brief description of the problem. Politely set expectations that next steps will be communicated shortly.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 2, "requires_approval": false, "requires_evidence": false, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 1, "template_updated_at": "2026-05-18T12:45:31.382Z"}, {"id": "2ef40dab-ce5b-4e29-844b-fe5cb7277533", "notes": null, "title": "Confirm Customer and Job Details", "sop_id": 11, "status": "in_progress", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 2, "updated_at": "2026-05-18T12:46:44.568Z", "sop_step_id": 2, "completed_at": null, "completed_by": null, "evidence_url": null, "instructions": "Retrieve the customer account using the provided phone number or name. Confirm the job address, original installation/service date, and warranty coverage terms. Note any exclusions or expired coverage. If coverage is uncertain, flag for manager review later.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 3, "requires_approval": false, "requires_evidence": false, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 2, "template_updated_at": "2026-05-18T12:45:31.382Z"}, {"id": "b571556f-8c7f-424c-9981-7943ef992911", "notes": null, "title": "Review Work Order History", "sop_id": 11, "status": "pending", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 3, "updated_at": "2026-05-18T12:46:26.907Z", "sop_step_id": 3, "completed_at": null, "completed_by": null, "evidence_url": null, "instructions": "Access prior work orders for the garage door or opener. Look for recurring issues, technician notes, parts replaced, and dates of service. Determine if the current problem may be related to previous work. Document findings in the call notes.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 3, "requires_approval": false, "requires_evidence": false, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 3, "template_updated_at": "2026-05-18T12:45:31.382Z"}, {"id": "1202509b-a7d4-4fc9-bb48-531b4f0a22a4", "notes": null, "title": "Request Photos or Video", "sop_id": 11, "status": "pending", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 4, "updated_at": "2026-05-18T12:46:26.907Z", "sop_step_id": 4, "completed_at": null, "completed_by": null, "evidence_url": null, "instructions": "If the issue is visually assessable (e.g., misalignment, damage, unusual noise), ask the customer to send clear photos or a short video to the designated department email or text number. Explain that this will speed up diagnosis and scheduling. Attach received media to the customer profile and note them in the call record.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 5, "requires_approval": false, "requires_evidence": true, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 4, "template_updated_at": "2026-05-18T12:45:31.382Z"}, {"id": "7c03ffdd-13de-4c44-9eee-b38b40928de0", "notes": null, "title": "Document and Assign Follow-Up Task", "sop_id": 11, "status": "pending", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 5, "updated_at": "2026-05-18T12:46:26.907Z", "sop_step_id": 5, "completed_at": null, "completed_by": null, "evidence_url": null, "instructions": "Create an internal follow-up task detailing the warranty concern, coverage status, work order history, and any attached media. Assign it to the dispatcher or service manager for scheduling a warranty inspection. Set a due date no later than the next business day.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 3, "requires_approval": false, "requires_evidence": false, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 5, "template_updated_at": "2026-05-18T12:45:31.382Z"}, {"id": "29e75c2b-fb55-4cbb-b056-596c65a18a1f", "notes": null, "title": "Escalate for Manager Approval", "sop_id": 11, "status": "pending", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 6, "updated_at": "2026-05-18T12:46:26.907Z", "sop_step_id": 6, "completed_at": null, "completed_by": null, "evidence_url": null, "instructions": "When warranty coverage is unclear, work order history indicates possible customer abuse or non-covered issues, or the request falls outside standard terms, escalate the case to the Service Manager. Attach all relevant documentation and await written approval or denial before proceeding with scheduling.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 5, "requires_approval": true, "requires_evidence": false, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 6, "template_updated_at": "2026-05-18T12:45:31.382Z"}, {"id": "1a478a81-6c2d-41c3-944a-dd6fea5368ee", "notes": null, "title": "Communicate Next Steps to Customer", "sop_id": 11, "status": "pending", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 7, "updated_at": "2026-05-18T12:46:26.907Z", "sop_step_id": 7, "completed_at": null, "completed_by": null, "evidence_url": null, "instructions": "After warranty status and scheduling plan are confirmed, contact the customer to explain the decision, next steps, and estimated time frame for the technician visit. If any non-covered charges may apply, disclose them at this stage. Record a summary of the conversation in the customer’s record.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 3, "requires_approval": false, "requires_evidence": false, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 7, "template_updated_at": "2026-05-18T12:45:31.382Z"}], "sop_id": 11, "status": "running", "revision": 2, "approvals": [], "sop_title": "Garage Door Warranty Call Intake", "wait_json": {}, "started_at": "2026-05-18T12:46:26.907Z", "started_by": 13, "state_json": {}, "updated_at": "2026-05-18T12:46:44.568Z", "assigned_to": 13, "completed_at": null, "blocked_reason": null, "current_step_id": 2, "started_by_name": "Terry Demo", "assigned_to_name": "Terry Demo", "current_step_title": "Confirm Customer and Job Details"}	{"id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "sop_id": 11, "status": "blocked", "revision": 3, "wait_json": {"type": "blocked", "reason": "Waiting for customer photos before continuing.", "blocked_at": "2026-05-18T12:47:02.042Z", "blocked_by": 13}, "started_at": "2026-05-18T12:46:26.907Z", "started_by": 13, "state_json": {}, "updated_at": "2026-05-18T12:47:02.042Z", "assigned_to": 13, "completed_at": null, "blocked_reason": "Waiting for customer photos before continuing.", "current_step_id": 2}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.120.0 Chrome/142.0.7444.265 Electron/39.8.8 Safari/537.36	2026-05-18 12:47:02.05292+00	13	39e429e8-2379-4272-b20a-e30a7fe9b9e2
6174e0dc-78a2-4444-9114-9233f4c4333b	\N	sop_run.resumed	sops	sop_run	39e429e8-2379-4272-b20a-e30a7fe9b9e2	{"id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "steps": [{"id": "6f037178-81e4-483a-a27a-8fa99e507d82", "notes": "Confirmed caller details and warranty concern.", "title": "Receive Warranty Call", "sop_id": 11, "status": "completed", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 1, "updated_at": "2026-05-18T12:46:44.568Z", "sop_step_id": 1, "completed_at": "2026-05-18T12:46:44.568Z", "completed_by": 13, "evidence_url": null, "instructions": "Answer call promptly and identify the nature of the inquiry as warranty-related. Verify if this is a new issue or a follow-up. Record the caller’s full name, phone number, and a brief description of the problem. Politely set expectations that next steps will be communicated shortly.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 2, "requires_approval": false, "requires_evidence": false, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 1, "template_updated_at": "2026-05-18T12:45:31.382Z"}, {"id": "2ef40dab-ce5b-4e29-844b-fe5cb7277533", "notes": null, "title": "Confirm Customer and Job Details", "sop_id": 11, "status": "blocked", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 2, "updated_at": "2026-05-18T12:47:02.045Z", "sop_step_id": 2, "completed_at": null, "completed_by": null, "evidence_url": null, "instructions": "Retrieve the customer account using the provided phone number or name. Confirm the job address, original installation/service date, and warranty coverage terms. Note any exclusions or expired coverage. If coverage is uncertain, flag for manager review later.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 3, "requires_approval": false, "requires_evidence": false, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 2, "template_updated_at": "2026-05-18T12:45:31.382Z"}, {"id": "b571556f-8c7f-424c-9981-7943ef992911", "notes": null, "title": "Review Work Order History", "sop_id": 11, "status": "pending", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 3, "updated_at": "2026-05-18T12:46:26.907Z", "sop_step_id": 3, "completed_at": null, "completed_by": null, "evidence_url": null, "instructions": "Access prior work orders for the garage door or opener. Look for recurring issues, technician notes, parts replaced, and dates of service. Determine if the current problem may be related to previous work. Document findings in the call notes.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 3, "requires_approval": false, "requires_evidence": false, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 3, "template_updated_at": "2026-05-18T12:45:31.382Z"}, {"id": "1202509b-a7d4-4fc9-bb48-531b4f0a22a4", "notes": null, "title": "Request Photos or Video", "sop_id": 11, "status": "pending", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 4, "updated_at": "2026-05-18T12:46:26.907Z", "sop_step_id": 4, "completed_at": null, "completed_by": null, "evidence_url": null, "instructions": "If the issue is visually assessable (e.g., misalignment, damage, unusual noise), ask the customer to send clear photos or a short video to the designated department email or text number. Explain that this will speed up diagnosis and scheduling. Attach received media to the customer profile and note them in the call record.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 5, "requires_approval": false, "requires_evidence": true, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 4, "template_updated_at": "2026-05-18T12:45:31.382Z"}, {"id": "7c03ffdd-13de-4c44-9eee-b38b40928de0", "notes": null, "title": "Document and Assign Follow-Up Task", "sop_id": 11, "status": "pending", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 5, "updated_at": "2026-05-18T12:46:26.907Z", "sop_step_id": 5, "completed_at": null, "completed_by": null, "evidence_url": null, "instructions": "Create an internal follow-up task detailing the warranty concern, coverage status, work order history, and any attached media. Assign it to the dispatcher or service manager for scheduling a warranty inspection. Set a due date no later than the next business day.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 3, "requires_approval": false, "requires_evidence": false, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 5, "template_updated_at": "2026-05-18T12:45:31.382Z"}, {"id": "29e75c2b-fb55-4cbb-b056-596c65a18a1f", "notes": null, "title": "Escalate for Manager Approval", "sop_id": 11, "status": "pending", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 6, "updated_at": "2026-05-18T12:46:26.907Z", "sop_step_id": 6, "completed_at": null, "completed_by": null, "evidence_url": null, "instructions": "When warranty coverage is unclear, work order history indicates possible customer abuse or non-covered issues, or the request falls outside standard terms, escalate the case to the Service Manager. Attach all relevant documentation and await written approval or denial before proceeding with scheduling.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 5, "requires_approval": true, "requires_evidence": false, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 6, "template_updated_at": "2026-05-18T12:45:31.382Z"}, {"id": "1a478a81-6c2d-41c3-944a-dd6fea5368ee", "notes": null, "title": "Communicate Next Steps to Customer", "sop_id": 11, "status": "pending", "created_at": "2026-05-18T12:46:26.907Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "step_order": 7, "updated_at": "2026-05-18T12:46:26.907Z", "sop_step_id": 7, "completed_at": null, "completed_by": null, "evidence_url": null, "instructions": "After warranty status and scheduling plan are confirmed, contact the customer to explain the decision, next steps, and estimated time frame for the technician visit. If any non-covered charges may apply, disclose them at this stage. Record a summary of the conversation in the customer’s record.", "required_role": "Office/Admin", "branch_condition": null, "estimated_minutes": 3, "requires_approval": false, "requires_evidence": false, "template_created_at": "2026-05-18T12:45:31.382Z", "template_step_order": 7, "template_updated_at": "2026-05-18T12:45:31.382Z"}], "sop_id": 11, "status": "blocked", "revision": 3, "approvals": [], "sop_title": "Garage Door Warranty Call Intake", "wait_json": {"type": "blocked", "reason": "Waiting for customer photos before continuing.", "blocked_at": "2026-05-18T12:47:02.042Z", "blocked_by": 13}, "started_at": "2026-05-18T12:46:26.907Z", "started_by": 13, "state_json": {}, "updated_at": "2026-05-18T12:47:02.042Z", "assigned_to": 13, "completed_at": null, "blocked_reason": "Waiting for customer photos before continuing.", "current_step_id": 2, "started_by_name": "Terry Demo", "assigned_to_name": "Terry Demo", "current_step_title": "Confirm Customer and Job Details"}	{"id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "sop_id": 11, "status": "running", "revision": 4, "wait_json": {}, "started_at": "2026-05-18T12:46:26.907Z", "started_by": 13, "state_json": {}, "updated_at": "2026-05-18T12:47:02.464Z", "assigned_to": 13, "completed_at": null, "blocked_reason": null, "current_step_id": 2}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.120.0 Chrome/142.0.7444.265 Electron/39.8.8 Safari/537.36	2026-05-18 12:47:02.474423+00	13	39e429e8-2379-4272-b20a-e30a7fe9b9e2
6cbebd45-a629-4098-af66-e591cae22397	\N	task.updated	tasks	task	\N	{"id": 21, "notes": null, "title": "Fleet Maintenance Schedule", "topic": null, "locked": true, "status": "todo", "all_day": false, "division": "Diversified", "due_date": "2026-05-18T00:00:00.000Z", "end_time": "10:00", "priority": "medium", "created_at": "2026-05-10T04:11:52.290Z", "is_private": false, "start_date": "2026-05-18T00:00:00.000Z", "start_time": "09:00", "assigned_to": 8, "description": "Create preventive maintenance schedule for all company vehicles", "completed_at": null, "estimated_hours": 0, "repeat_schedule": "None", "assigned_to_name": "Jordan Strasser", "estimated_minutes": 0, "assigned_department": "Operations"}	{"id": 21, "notes": null, "title": "Fleet Maintenance Schedule", "topic": null, "locked": true, "status": "todo", "all_day": false, "division": "Diversified", "due_date": "2026-05-18T00:00:00.000Z", "end_time": "10:00", "priority": "medium", "created_at": "2026-05-10T04:11:52.290Z", "is_private": false, "start_date": "2026-05-19T00:00:00.000Z", "start_time": "09:00", "assigned_to": 8, "description": "Create preventive maintenance schedule for all company vehicles", "completed_at": null, "estimated_hours": 0, "repeat_schedule": "None", "assigned_to_name": "Jordan Strasser", "estimated_minutes": 0, "assigned_department": "Operations"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-19 00:34:43.623442+00	12	21
fc0207b8-3759-49f6-913a-a8fa542b18d4	\N	microsoft_graph.connected	integrations	microsoft_graph_connection	\N	null	{"status": "connected"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-19 03:09:05.764514+00	12	\N
1cb66fe7-f9b2-4e07-a94f-54d7c77794c0	\N	microsoft_graph.connected	integrations	microsoft_graph_connection	\N	null	{"status": "connected"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-19 03:09:55.621359+00	12	\N
d3937199-02fa-4829-97b0-301eda36eff2	\N	work_order.deleted	work_orders	work_order	\N	{"id": 12, "type": "Compliance", "notes": null, "owner": 1, "title": "Generator Load Test", "status": "in_progress", "division": "Operations", "due_date": "2026-05-05T00:00:00.000Z", "priority": "medium", "created_at": "2026-05-09T14:14:47.292Z", "created_by": null, "owner_name": "Marcus Rivera", "updated_at": "2026-05-14T00:08:34.893Z", "updated_by": null, "description": "Monthly test per compliance schedule", "completed_at": null, "assigned_to_name": "Marcus Rivera"}	null	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-19 08:49:13.024504+00	12	12
e7af359c-2c59-4d6b-ab7e-562173b0234c	\N	work_order.deleted	work_orders	work_order	\N	{"id": 9, "type": "Fleet", "notes": null, "owner": 2, "title": "Fleet Vehicle 4 Oil Change", "status": "in_progress", "division": "Operations", "due_date": "2026-05-11T00:00:00.000Z", "priority": "high", "created_at": "2026-05-09T14:14:47.292Z", "created_by": null, "owner_name": "Destiny Johnson", "updated_at": "2026-05-14T00:08:34.893Z", "updated_by": null, "description": "2019 Ford Transit — 5,000 miles overdue", "completed_at": null, "assigned_to_name": "Destiny Johnson"}	null	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-19 08:49:21.294852+00	12	9
355ac752-d9b9-49b1-9f33-9a904ddcd025	\N	work_order.deleted	work_orders	work_order	\N	{"id": 7, "type": "Maintenance", "notes": null, "owner": 2, "title": "Bay Door 3 Hydraulic Repair", "status": "open", "division": "Operations", "due_date": "2026-05-12T00:00:00.000Z", "priority": "high", "created_at": "2026-05-09T14:14:47.292Z", "created_by": null, "owner_name": "Destiny Johnson", "updated_at": "2026-05-14T00:08:34.893Z", "updated_by": null, "description": "Door sticking on open cycle, reported by warehouse staff", "completed_at": null, "assigned_to_name": "Destiny Johnson"}	null	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-19 08:49:25.009133+00	12	7
\.


--
-- Data for Name: automation_events; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.automation_events (id, event_type, source_module, entity_type, entity_id, payload, status, n8n_webhook_url, response_status, response_body, error_message, created_at, processed_at) FROM stdin;
4adda379-6856-4341-9a36-56ea70c28529	sop_generated	sops	sop	\N	{"path": "/sops?sop=11", "title": "Garage Door Warranty Call Intake", "sop_id": 11, "category": "Customer Follow-Up", "entity_id": 11, "timestamp": "2026-05-18T12:45:31.419Z", "step_count": 7, "actor_user_id": 13}	config_missing	\N	\N	\N	\N	2026-05-18 12:45:31.420171+00	\N
abd48bde-84e6-4e97-98ea-896c63378cd9	sop_run_started	sops	sop_run	39e429e8-2379-4272-b20a-e30a7fe9b9e2	{"path": "/sops?run=39e429e8-2379-4272-b20a-e30a7fe9b9e2", "sop_id": 11, "entity_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "timestamp": "2026-05-18T12:46:26.938Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "assigned_to": 13, "actor_user_id": 13}	config_missing	\N	\N	\N	\N	2026-05-18 12:46:26.939037+00	\N
757d4fd2-530d-4119-9f9e-756a540033ae	sop_run_step_completed	sops	sop_run	39e429e8-2379-4272-b20a-e30a7fe9b9e2	{"path": "/sops?run=39e429e8-2379-4272-b20a-e30a7fe9b9e2", "result": {"run": {"id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "sop_id": 11, "status": "running", "revision": 2, "wait_json": {}, "started_at": "2026-05-18T12:46:26.907Z", "started_by": 13, "state_json": {}, "updated_at": "2026-05-18T12:46:44.568Z", "assigned_to": 13, "completed_at": null, "blocked_reason": null, "current_step_id": 2}, "status": "advanced", "next_step_id": 2}, "entity_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "timestamp": "2026-05-18T12:46:44.599Z", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "sop_step_id": 1, "actor_user_id": 13}	config_missing	\N	\N	\N	\N	2026-05-18 12:46:44.59989+00	\N
fc096558-35d9-40f4-9986-519e0d131634	sop_run_blocked	sops	sop_run	39e429e8-2379-4272-b20a-e30a7fe9b9e2	{"path": "/sops?run=39e429e8-2379-4272-b20a-e30a7fe9b9e2", "reason": "Waiting for customer photos before continuing.", "entity_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "timestamp": "2026-05-18T12:47:02.058Z", "wait_type": "blocked", "sop_run_id": "39e429e8-2379-4272-b20a-e30a7fe9b9e2", "actor_user_id": 13}	config_missing	\N	\N	\N	\N	2026-05-18 12:47:02.059095+00	\N
7bf6ccba-818c-42c0-978c-521c90e80869	sop_generated	sops	sop	\N	{"path": "/sops?sop=12", "title": "Warranty Follow-Up Triage SOP", "sop_id": 12, "category": "Office Procedures", "entity_id": 12, "timestamp": "2026-05-18T15:35:32.828Z", "step_count": 7, "actor_user_id": 13}	config_missing	\N	\N	\N	\N	2026-05-18 15:35:32.82871+00	\N
1ac72e66-34e0-4537-9509-d990e087357f	work_order_deleted	work_orders	work_order	\N	{"path": "/work-orders", "title": "Generator Load Test", "status": "in_progress", "entity_id": 12, "timestamp": "2026-05-19T08:49:13.032Z", "actor_user_id": 12, "work_order_id": 12}	config_missing	\N	\N	\N	\N	2026-05-19 08:49:13.032475+00	\N
8ad81ebc-a770-4af2-b565-37b18aad4e9d	work_order_deleted	work_orders	work_order	\N	{"path": "/work-orders", "title": "Fleet Vehicle 4 Oil Change", "status": "in_progress", "entity_id": 9, "timestamp": "2026-05-19T08:49:21.300Z", "actor_user_id": 12, "work_order_id": 9}	config_missing	\N	\N	\N	\N	2026-05-19 08:49:21.300841+00	\N
6d8ad3a0-55d7-45ed-9043-56d40b279c15	work_order_deleted	work_orders	work_order	\N	{"path": "/work-orders", "title": "Bay Door 3 Hydraulic Repair", "status": "open", "entity_id": 7, "timestamp": "2026-05-19T08:49:25.013Z", "actor_user_id": 12, "work_order_id": 7}	config_missing	\N	\N	\N	\N	2026-05-19 08:49:25.013967+00	\N
\.


--
-- Data for Name: calendar_blocks; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.calendar_blocks (id, title, description, block_type, status, priority, assigned_to, linked_task_id, linked_work_order_id, company_division, start_time, end_time, all_day, notes, created_by, created_at, updated_at, assigned_to_employee_id, linked_task_int_id, linked_work_order_int_id, created_by_user_id) FROM stdin;
\.


--
-- Data for Name: calendar_sync_logs; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.calendar_sync_logs (id, user_id, provider, status, message, event_count, started_at, finished_at, metadata) FROM stdin;
c1ffa5ef-31d5-46e6-b405-7627becabd81	12	microsoft_365	failed	The mailbox is either inactive, soft-deleted, or is hosted on-premise.	0	2026-05-19 03:09:22.312636+00	2026-05-19 03:09:22.683881+00	{"to": "2026-05-25T06:59:59.999Z", "from": "2026-05-18T07:00:00.000Z"}
aa10abdd-c29f-40f3-9004-ef144e2795d1	12	microsoft_365	failed	The mailbox is either inactive, soft-deleted, or is hosted on-premise.	0	2026-05-19 03:09:26.401468+00	2026-05-19 03:09:26.5292+00	{"to": "2026-05-25T06:59:59.999Z", "from": "2026-05-18T07:00:00.000Z"}
4fdb9ac5-b443-4f7a-ae55-728218a70b59	12	microsoft_365	success	Synced 0 Outlook event(s).	0	2026-05-19 03:09:59.36644+00	2026-05-19 03:09:59.461981+00	{"to": "2026-05-25T06:59:59.999Z", "from": "2026-05-18T07:00:00.000Z", "startedAt": "2026-05-19T03:09:59.366Z", "finishedAt": "2026-05-19T03:09:59.461Z"}
a2262c03-4cce-47e8-994a-435341df9c6f	12	microsoft_365	success	Synced 0 Outlook event(s).	0	2026-05-19 03:11:38.69254+00	2026-05-19 03:11:39.034049+00	{"to": "2026-05-25T06:59:59.999Z", "from": "2026-05-18T07:00:00.000Z", "startedAt": "2026-05-19T03:11:38.692Z", "finishedAt": "2026-05-19T03:11:39.033Z"}
8b6abf5b-8b8b-49cd-88c9-01a15287fe1e	12	microsoft_365	success	Synced 1 Outlook event(s).	1	2026-05-19 08:47:25.678026+00	2026-05-19 08:47:27.24627+00	{"to": "2026-05-25T06:59:59.999Z", "from": "2026-05-18T07:00:00.000Z", "startedAt": "2026-05-19T08:47:25.677Z", "finishedAt": "2026-05-19T08:47:27.245Z"}
362d73b4-376d-40cc-a127-256ea311b173	12	microsoft_365	success	Synced 1 Outlook event(s).	1	2026-05-19 08:48:21.879497+00	2026-05-19 08:48:22.145866+00	{"to": "2026-05-25T06:59:59.999Z", "from": "2026-05-18T07:00:00.000Z", "startedAt": "2026-05-19T08:48:21.879Z", "finishedAt": "2026-05-19T08:48:22.145Z"}
e35a717e-988f-477c-afc3-bdf66241c8fe	12	microsoft_365	success	Synced 0 Outlook event(s).	0	2026-05-19 08:48:27.773871+00	2026-05-19 08:48:28.032254+00	{"to": "2026-05-25T06:59:59.999Z", "from": "2026-05-18T07:00:00.000Z", "startedAt": "2026-05-19T08:48:27.773Z", "finishedAt": "2026-05-19T08:48:28.031Z"}
\.


--
-- Data for Name: document_audit_logs; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.document_audit_logs (id, document_id, action, performed_by, details, created_at) FROM stdin;
\.


--
-- Data for Name: document_signatures; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.document_signatures (id, document_id, signer_name, signer_email, signer_role, signature_order, status, signed_at, signature_data, created_at) FROM stdin;
\.


--
-- Data for Name: document_versions; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.document_versions (id, document_id, version_number, file_url, changes_description, created_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.documents (id, document_type, entity_type, entity_id, title, file_path, file_url, storage_url, file_size, mime_type, status, sign_status, generated_by, signed_by, signed_at, signature_data, metadata, generated_at, created_at, updated_at, description, file_id, category, owner_id, company_division, created_by) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.employees (id, name, role, department, status, email, phone, avatar_url, hire_date, created_at, password_hash, last_login_at, auth_provider, auth_subject, auth_last_synced_at) FROM stdin;
1	Marcus Rivera	Operations Manager	Operations	active	marcus@diversified.com	602-555-0101	\N	2021-03-15	2026-05-09 14:14:47.28981+00	\N	\N	\N	\N	\N
2	Destiny Johnson	Field Technician	Operations	active	destiny@diversified.com	602-555-0102	\N	2022-06-01	2026-05-09 14:14:47.28981+00	\N	\N	\N	\N	\N
3	Carlos Mendez	Warehouse Lead	Logistics	active	carlos@diversified.com	602-555-0103	\N	2020-11-10	2026-05-09 14:14:47.28981+00	\N	\N	\N	\N	\N
5	Jordan Lee	Field Technician	Operations	active	jordan@diversified.com	602-555-0105	\N	2022-09-12	2026-05-09 14:14:47.28981+00	\N	\N	\N	\N	\N
6	Priya Patel	HR Coordinator	Human Resources	active	priya@diversified.com	602-555-0106	\N	2021-07-08	2026-05-09 14:14:47.28981+00	\N	\N	\N	\N	\N
7	Terry Strasser	CEO	Executive	active	tstrasser@divco.net	608-555-0201	\N	2005-01-01	2026-05-10 04:11:52.288037+00	\N	\N	\N	\N	\N
8	Jordan Strasser	Operations Director	Operations	active	jordan@divco.net	608-555-0202	\N	2010-03-15	2026-05-10 04:11:52.288037+00	\N	\N	\N	\N	\N
9	Cathy Kraft	Office Manager	Administration	active	ckraft@divco.net	608-555-0203	\N	2012-06-01	2026-05-10 04:11:52.288037+00	\N	\N	\N	\N	\N
10	Jill Strasser	HR Manager	Human Resources	active	jstrasser@divco.net	608-555-0204	\N	2008-09-10	2026-05-10 04:11:52.288037+00	\N	\N	\N	\N	\N
11	Diversified Admin	Leadership	Leadership	active	admin@diversified.local	\N	\N	2026-05-14	2026-05-14 00:32:54.916497+00	\N	\N	\N	\N	\N
4	Aisha Thompson	Admin Coordinator	Administration	inactive	aisha@diversified.com	602-555-0104	\N	2023-01-20	2026-05-09 14:14:47.28981+00	\N	\N	\N	\N	\N
13	Terry Demo	Leadership	Leadership	active	terry.demo@diversified.local	\N	\N	2026-05-14	2026-05-14 16:44:13.717421+00	scrypt$16384$8$1$ba3306e6ff8fa351266e62636ec9eeaa$1ba2eea5b13c255dbdb122801afe78675160080bd6b0656dadb6c2f64f9e8f6d80d873d9990f4a946fdde0bb6f4768ef0e4450fd4fc0ede8228c7601185e0e74	2026-05-20 13:25:36.817386+00	\N	\N	\N
12	ZITADEL Admin	Leadership	Pending Access	active	cruz@snrglabs.com	\N	\N	2026-05-14	2026-05-14 00:32:55.288579+00	\N	2026-05-20 15:26:43.481463+00	zitadel	372806628976166769	2026-05-20 15:26:43.481463+00
\.


--
-- Data for Name: file_records; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.file_records (id, name, category, uploaded_by, uploaded_at, size_bytes, url, linked_task_id, linked_request_id, linked_work_order_id, linked_sop_id, original_name, stored_name, storage_path, mime_type, uploaded_by_user_id, created_at, linked_entity_type, linked_entity_id) FROM stdin;
1	onboarding-checklist-2026.pdf	document	Cathy Kraft	2026-05-09 16:00:00+00	145408		\N	\N	\N	\N	onboarding-checklist-2026.pdf	\N	\N	\N	\N	2026-05-14 00:08:35.103629+00	\N	\N
2	work-order-3021-site-photos.zip	archive	Marcus Lee	2026-05-09 17:30:00+00	19267584		\N	\N	3021	\N	work-order-3021-site-photos.zip	\N	\N	\N	\N	2026-05-14 00:08:35.103629+00	\N	\N
3	safety-inspection-may2026.pdf	document	Terry Strasser	2026-05-08 21:00:00+00	220160		\N	\N	\N	\N	safety-inspection-may2026.pdf	\N	\N	\N	\N	2026-05-14 00:08:35.103629+00	\N	\N
4	hvac-unit2-quote.pdf	contract	Jordan Strasser	2026-05-08 18:30:00+00	90112		\N	\N	3018	\N	hvac-unit2-quote.pdf	\N	\N	\N	\N	2026-05-14 00:08:35.103629+00	\N	\N
5	employee-handbook-v4.pdf	document	Cathy Kraft	2026-05-07 23:00:00+00	512000		\N	\N	\N	\N	employee-handbook-v4.pdf	\N	\N	\N	\N	2026-05-14 00:08:35.103629+00	\N	\N
6	supply-order-may-receipt.pdf	document	Olivia Turner	2026-05-07 16:15:00+00	73728		\N	\N	\N	\N	supply-order-may-receipt.pdf	\N	\N	\N	\N	2026-05-14 00:08:35.103629+00	\N	\N
7	breakroom-microwave-invoice.pdf	contract	Natalie Brooks	2026-05-06 20:00:00+00	65536		\N	\N	\N	\N	breakroom-microwave-invoice.pdf	\N	\N	\N	\N	2026-05-14 00:08:35.103629+00	\N	\N
8	osha-training-certificate.pdf	document	Derek Santos	2026-05-05 22:30:00+00	184320		\N	\N	\N	\N	osha-training-certificate.pdf	\N	\N	\N	\N	2026-05-14 00:08:35.103629+00	\N	\N
9	contractor-nda-signed.pdf	contract	Amanda Price	2026-05-04 18:00:00+00	102400		\N	\N	\N	\N	contractor-nda-signed.pdf	\N	\N	\N	\N	2026-05-14 00:08:35.103629+00	\N	\N
10	inventory-audit-q1-2026.xlsx	spreadsheet	Jordan Strasser	2026-05-03 17:00:00+00	258048		\N	\N	\N	\N	inventory-audit-q1-2026.xlsx	\N	\N	\N	\N	2026-05-14 00:08:35.103629+00	\N	\N
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.files (id, original_name, stored_name, storage_path, mime_type, size_bytes, category, linked_entity_type, linked_entity_id, uploaded_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: forms; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.forms (id, title, type, submitted_by, status, form_data, submitted_at, reviewed_at, created_at) FROM stdin;
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.inventory (id, item_name, category, quantity, unit, location, status, reorder_threshold, last_updated, created_at) FROM stdin;
2	Safety Vests	Safety	8	units	Warehouse A - Shelf 1	low_stock	10	2026-05-09 14:14:47.293675+00	2026-05-09 14:14:47.293675+00
3	Hydraulic Fluid (Gallon)	Maintenance	3	gallons	Maintenance Bay	low_stock	5	2026-05-09 14:14:47.293675+00	2026-05-09 14:14:47.293675+00
4	HVAC Filters 20x20	Maintenance	24	units	Storage Room B	in_stock	6	2026-05-09 14:14:47.293675+00	2026-05-09 14:14:47.293675+00
5	Zip Ties (Pack)	Supplies	45	packs	Warehouse B - Shelf 7	in_stock	10	2026-05-09 14:14:47.293675+00	2026-05-09 14:14:47.293675+00
6	Motor Oil 5W-30 (Quart)	Fleet	6	quarts	Maintenance Bay	low_stock	12	2026-05-09 14:14:47.293675+00	2026-05-09 14:14:47.293675+00
10	Paint — Safety Yellow (Gallon)	Facilities	0	gallons	Maintenance Bay	out_of_stock	2	2026-05-09 14:14:47.293675+00	2026-05-09 14:14:47.293675+00
1	Nitrile Gloves (Box)	Safety	12	boxes	Warehouse A - Shelf 3	in_stock	5	2026-05-09 14:14:47.293675+00	2026-05-09 14:14:47.293675+00
8	First Aid Kit	Safety	3	units	Break Room	low_stock	4	2026-05-09 14:14:47.293675+00	2026-05-09 14:14:47.293675+00
7	Copy Paper (Ream)	Office	9	reams	Admin Supply Closet	low_stock	5	2026-05-09 14:14:47.293675+00	2026-05-09 14:14:47.293675+00
9	Extension Cord 50ft	Equipment	8	units	Warehouse A - Shelf 5	in_stock	2	2026-05-09 14:14:47.293675+00	2026-05-09 14:14:47.293675+00
\.


--
-- Data for Name: microsoft_connections; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.microsoft_connections (id, user_id, microsoft_user_id, email, display_name, tenant_id, access_token_enc, refresh_token_enc, token_expires_at, scopes, status, last_sync_at, created_at, updated_at) FROM stdin;
061c5d15-5748-4d2c-bfe2-ede1a09a8166	12	8d9cbc07d49fbb13	vulpine444@outlook.com	Daniel Cruz	common	v1:I4dliEPdrkmKUrLI:I8OqCOhRY1or903XWPFnww==:ArY0FoIiU2Yp/SHz19NWv6+ItMm4Te3tHmsdBR6P4tQYITGSN5Ds4HejTokljaVo7AnwYkYoORh00aZaT0JAYL7JXWGJuXp12nnWYf7msXmOdJcOPaU8GoUc7VW5/cEJGF/TW87TpOrcPhtXXzHxsudEQ2Z2l9Z7bMC3AtfB42SP3uNKcwrAtluxJ0OGbblc2lFoVtJQaJnS0kssbeH3gxxCE0Z3Tj/jevBB1TAU7/I9Lq636i8+JgN5aKki4gPzfVHvE9BarDxOP9DnLRj6ct5mz+lzZbhs8OgSC9jOLqiGqi2BSWEwRgXbvDG8VQLugEC5+6HU6gYoihL7iZhQNG2khRIbkru2qlcs5DBPht9MXIZCHdbJ0bYm/wm00lI+K1VByFIHkosIVZbYxFMzEawnDP8SBH/trdArj47yr0kAmjzPVU4/ZuR/2oUQCjInX5R760m4hNdqT+72egF4yIVsjIpqj1J3IwO9PVEKr00DRDvLsq5MqkNUTvVy0ev4jGFoD5RvH3JaXvc1dHuRnwHuYrPX8qNkP/pdTXPFqrKm5iNWfiQrjHFN2CL8Na4SZ91yXZt8KAo+7hkdTEzabaDuaCFsKvZC8QRVa3QNZ7eC4yDvwV5suWElu7/KgQflcctfg+84+ScYgkibFCtlXGFUuBZrVXyOWvniAyUj1bpNkSlhx1u/z9g6rLLRcINtFesKyQ1wTfRLfJXgkKcMu0aKG4Z/gLp9oHFfAl/oWgwYerZG44dSZ/bQFyIpocYNmFs+CEty+79KOCaD2mWTGjcSmyfq5zrJbmLarHl3/JNGZicnIYPoES115C8DkrCK18w4W6900Gri73rQZZ0cKGwJ/2pCd64KPqxWeg7dt1P2Y4/rvZqVSS8X9o/vvU4eTDcDg+d+mqE4M2WCWEWGvXdEYo4PF27IkLxlA1hy71YsjfAXHOPKFYuLk6gzwwYbwOkDEh8X4FP7BnnbtQtKsBgg4anRYrG2jx9qiIlPgGs7XcDD9NjrPsQlTBbH/bKzYXt3b24piAHlGPiHZJAh9nLEYPCDcl6sZ9zYQiH+NRvEm1BSzKE3m5gfEVGpsvfgpcQOatXN2BOu4dz2bzzmemAHMPLwVTkBlbbxHOBkgcEQJ/jHAYCqsqTm6C0Wubm+f4SuK0UCIwdEjBirmiLPMq91qjfkqz9QfrMVIy+SGRCnJI6Es3o7xYF/JFMpYmR3FfyT5ljxvkzlOeDGUxd855NQEdTiW5XRhUmMdSt7/eNwqV5sSPA0cqTnASs0f3C5ShIL0MfGYTEOHgy2ArhxFKUddc038t507rt17cSQz332aGj41i5svdI3C7dV7oObziFKieUwzo/Nj3TZoLIKwAtSobHMziIxi6SImBDTw27WY02IuTh/rn5K14PXSgLVRoEafsf9p9GAcTn8RCjnMjbQ6v0+qdjIEz+fw4gj2VQ7k2Lh36w5pJXMqtkd4cZhFJz1FMsx7Sl80IQyeGW5iqUYfTNyDtCBdHg/BUQD2c4YfdUfGIJcIixkbBIe3pC4P5HlwlZNzfuKUAl+rSssmPG9pnvBDPDgx5oripgZCz4JUovc2W964nRyLhio8j4kySLfQiuCoT+TqviGLfH4BVDxHsWOEVsdhRO88yXJ8hKFaeI36sMpE4UwWNLNrHO8L/UC5FRooOVvhH9p0mxU/d2NUVussHHl6VgiJw9Fq3Pprc2e7yXRDmQLKwoAzMEjbB2UAmPDg7+e0MncGQCxdfnWWugvY3O/hLeap7cYum+tHdWHCFX8SDbgIIRgAJqGL89FVHmCG/QNnIs3kpNOnb/Hh3TVSBArakHeXGdfliI9k+VjSPbiU5v+Q/WEOReMPFAX/5zcnqn/db3WYHQubt+wzi9Zg69oDqCZnHoFf1MSi2YH5CbdmZzniyCHXNX98YlCftW/JD2gMWAZ36Jx4MOGC8A9hNQe	v1:0554bhMRBAZBgc3V:hZHAZhmH+BQofUVEvXdiYg==:4NP2tupNpSB7GD+62nzhPaZJ+Halv2kkGQZx1+2HCCPygwRr4qIdQYXXNqN7vtO4KshQlOyqdd0bDQVYufCPRUsWd3pPyjUDGRI8TzVCC7LBhAol4FEjCAtQcVBCC2kffZ33LsrhSpm1DOFql7gbRwfbycgDSpI6xEkk8N+l/InR/0sq+l4RpPdFGmrjz2k+nfqJbNgsfSAep0FvXPenVh9Jme6Y+CDUCsODNd5bH0SUj4boyKten5J9zgBbtaXLiPqEB2d6Tb7Bp2ZH0/nYq5siFECPQ26vUXlwnWOXsa4SIeYF2Q+gcrW2Wn6TqMHdtbOB5IvDkimJ0lRkJYK93n1g+1lMUxLTQvP/DPvE2L+8yUE2ErPFUvtf1F2uOFXT821H1wqsh5tJ+wDy4ctA79VjR60bNOssJoQIbWaQ4DfWT1cerb49vW7nP69ARvU+WE57KeyjpqdGfTl5vPoUwct4phVg3fC0tD4CxL53yCDeP1SHPwwCfMJvsIjepcibGR6NismFscNb2m5YwBE9PfVwJHA108BoMFVrgXoRZiCk+0S1mWWnTQ==	2026-05-19 09:47:25.879+00	openid profile User.Read Calendars.Read	connected	2026-05-19 08:48:28.028278+00	2026-05-19 03:09:05.749595+00	2026-05-19 08:48:28.028278+00
\.


--
-- Data for Name: nc_api_token_scopes; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_api_token_scopes (id, fk_api_token_id, resource_type, resource_id, permissions, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_api_tokens; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_api_tokens (id, base_id, db_alias, description, permissions, token, expiry, enabled, fk_user_id, fk_workspace_id, fk_sso_client_id, created_at, updated_at, token_hash, token_prefix, last_used_at) FROM stdin;
\.


--
-- Data for Name: nc_audit_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_audit_v2 (id, "user", ip, source_id, base_id, fk_model_id, row_id, op_type, op_sub_type, status, description, details, fk_user_id, fk_ref_id, fk_parent_id, fk_workspace_id, fk_org_id, user_agent, version, created_at, updated_at, old_id) FROM stdin;
\.


--
-- Data for Name: nc_automation_executions; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_automation_executions (id, fk_workspace_id, base_id, fk_workflow_id, workflow_data, execution_data, finished, started_at, finished_at, status, created_at, updated_at, resume_at, error_notified_at) FROM stdin;
\.


--
-- Data for Name: nc_automation_subscribers; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_automation_subscribers (id, fk_workspace_id, base_id, fk_automation_id, fk_user_id, notify_on_error, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_automations; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_automations (id, title, description, meta, fk_workspace_id, base_id, "order", type, created_by, updated_by, created_at, updated_at, enabled, nodes, edges, draft, config, script, draft_reminder_sent_at, deleted) FROM stdin;
\.


--
-- Data for Name: nc_base_users_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_base_users_v2 (base_id, fk_user_id, roles, starred, pinned, "group", color, "order", hidden, opened_date, invited_by, fk_workspace_id, created_at, updated_at) FROM stdin;
pdino8tpcml3eup	us01zuvdfry4xe7g	owner	\N	\N	\N	\N	\N	\N	\N	\N	wdit5tu4	2026-05-09 10:51:38+00	2026-05-09 10:51:38+00
\.


--
-- Data for Name: nc_base_variables; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_base_variables (id, base_id, fk_workspace_id, key, value, description, inheritance, type, "order", default_value, is_overridden, is_inherited, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_bases_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_bases_v2 (id, title, prefix, status, description, meta, color, uuid, password, roles, deleted, is_meta, "order", type, fk_workspace_id, is_snapshot, fk_custom_url_id, version, default_role, created_at, updated_at, managed_app_master, managed_app_id, managed_app_version_id, auto_update, is_sandbox_production, is_sandbox) FROM stdin;
pdino8tpcml3eup	Getting Started		\N	\N	{"iconColor":"#36BFFF"}	\N	\N	\N	\N	f	t	1	database	wdit5tu4	f	\N	2	\N	2026-05-09 10:51:38+00	2026-05-09 10:51:38+00	f	\N	\N	t	f	f
\.


--
-- Data for Name: nc_calendar_view_columns_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_calendar_view_columns_v2 (id, base_id, source_id, fk_view_id, fk_column_id, show, bold, underline, italic, "order", fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_calendar_view_range_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_calendar_view_range_v2 (id, fk_view_id, fk_to_column_id, label, fk_from_column_id, base_id, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_calendar_view_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_calendar_view_v2 (fk_view_id, base_id, source_id, title, fk_cover_image_col_id, meta, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_chat_messages; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_chat_messages (id, fk_session_id, fk_workspace_id, role, content, parts, model, input_tokens, output_tokens, created_at, updated_at, base_id, bt_span_id, files) FROM stdin;
\.


--
-- Data for Name: nc_chat_sessions; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_chat_sessions (id, fk_workspace_id, fk_user_id, title, summary, total_input_tokens, total_output_tokens, message_count, created_at, updated_at, meta, base_id) FROM stdin;
\.


--
-- Data for Name: nc_col_barcode_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_col_barcode_v2 (id, fk_column_id, fk_barcode_value_column_id, barcode_format, deleted, base_id, fk_workspace_id, created_at, updated_at, error) FROM stdin;
\.


--
-- Data for Name: nc_col_button_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_col_button_v2 (id, base_id, type, label, theme, color, icon, formula, formula_raw, error, parsed_tree, fk_webhook_id, fk_column_id, fk_integration_id, model, output_column_ids, fk_workspace_id, fk_script_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_col_formula_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_col_formula_v2 (id, fk_column_id, formula, formula_raw, error, deleted, "order", parsed_tree, base_id, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_col_long_text_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_col_long_text_v2 (id, fk_workspace_id, base_id, fk_model_id, fk_column_id, fk_integration_id, model, prompt, prompt_raw, error, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_col_lookup_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_col_lookup_v2 (id, fk_column_id, fk_relation_column_id, fk_lookup_column_id, deleted, base_id, fk_workspace_id, created_at, updated_at, error) FROM stdin;
\.


--
-- Data for Name: nc_col_qrcode_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_col_qrcode_v2 (id, fk_column_id, fk_qr_value_column_id, deleted, "order", base_id, fk_workspace_id, created_at, updated_at, error) FROM stdin;
\.


--
-- Data for Name: nc_col_relations_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_col_relations_v2 (id, ref_db_alias, type, virtual, db_type, fk_column_id, fk_related_model_id, fk_child_column_id, fk_parent_column_id, fk_mm_model_id, fk_mm_child_column_id, fk_mm_parent_column_id, ur, dr, fk_index_name, deleted, fk_target_view_id, base_id, fk_workspace_id, fk_related_base_id, fk_mm_base_id, fk_related_source_id, fk_mm_source_id, created_at, updated_at, version, fk_display_value_column_id) FROM stdin;
\.


--
-- Data for Name: nc_col_rollup_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_col_rollup_v2 (id, fk_column_id, fk_relation_column_id, fk_rollup_column_id, rollup_function, deleted, base_id, fk_workspace_id, created_at, updated_at, error) FROM stdin;
\.


--
-- Data for Name: nc_col_select_options_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_col_select_options_v2 (id, fk_column_id, title, color, "order", base_id, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_columns_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_columns_v2 (id, source_id, base_id, fk_model_id, title, column_name, uidt, dt, np, ns, clen, cop, pk, pv, rqd, un, ct, ai, "unique", cdf, cc, csn, dtx, dtxp, dtxs, au, validate, virtual, deleted, system, "order", meta, description, readonly, fk_workspace_id, custom_index_name, created_at, updated_at, internal_meta) FROM stdin;
cvuhtun2njrvjwk	bqet41oj0mfc9dw	pdino8tpcml3eup	m60o1f3we1sjcb4	Id	id	ID	int4	\N	\N	\N	\N	t	\N	t	t	\N	t	\N	\N	\N	\N	specificType	\N	\N	\N	\N	\N	\N	f	1	{}	\N	f	wdit5tu4	\N	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00	\N
c82wd5zgq91v7zv	bqet41oj0mfc9dw	pdino8tpcml3eup	m60o1f3we1sjcb4	CreatedAt	created_at	CreatedTime	timestamp	\N	\N	\N	\N	f	\N	f	f	\N	f	\N	\N	\N	\N	specificType		 	\N	\N	\N	\N	t	2	{}	\N	f	wdit5tu4	\N	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00	\N
c19ye8asc1gjhp8	bqet41oj0mfc9dw	pdino8tpcml3eup	m60o1f3we1sjcb4	UpdatedAt	updated_at	LastModifiedTime	timestamp	\N	\N	\N	\N	f	\N	f	f	\N	f	\N	\N	\N	\N	specificType		 	\N	\N	\N	\N	t	3	{}	\N	f	wdit5tu4	\N	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00	\N
clyzjegm4i1pxcc	bqet41oj0mfc9dw	pdino8tpcml3eup	m60o1f3we1sjcb4	nc_created_by	created_by	CreatedBy	character varying	\N	\N	\N	\N	f	\N	f	f	\N	f	\N	\N	\N	\N	specificType	\N	\N	\N	\N	\N	\N	t	4	{}	\N	f	wdit5tu4	\N	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00	\N
cnujy9xiexdbife	bqet41oj0mfc9dw	pdino8tpcml3eup	m60o1f3we1sjcb4	nc_updated_by	updated_by	LastModifiedBy	character varying	\N	\N	\N	\N	f	\N	f	f	\N	f	\N	\N	\N	\N	specificType	\N	\N	\N	\N	\N	\N	t	5	{}	\N	f	wdit5tu4	\N	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00	\N
c1a8zcszemtc59r	bqet41oj0mfc9dw	pdino8tpcml3eup	m60o1f3we1sjcb4	nc_order	nc_order	Order	numeric	\N	\N	\N	\N	f	\N	f	f	\N	f	\N	\N	\N	\N	specificType	\N	\N	\N	\N	\N	\N	t	6	{}	\N	f	wdit5tu4	\N	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00	\N
crfl2f1v8mhc3lc	bqet41oj0mfc9dw	pdino8tpcml3eup	m60o1f3we1sjcb4	__nc_deleted	__nc_deleted	Deleted	boolean	\N	\N	\N	\N	f	\N	f	f	\N	f	\N	\N	\N	\N	specificType		 	\N	\N	\N	\N	t	7	{}	\N	f	wdit5tu4	\N	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00	\N
c04uwrhozg7koij	bqet41oj0mfc9dw	pdino8tpcml3eup	m60o1f3we1sjcb4	nc_row_meta	nc_row_meta	Meta	jsonb	\N	\N	\N	\N	f	\N	f	f	\N	f	\N	\N	\N	\N	specificType	\N	\N	\N	\N	\N	\N	t	8	{}	\N	f	wdit5tu4	\N	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00	\N
c27su3znpb5ibjx	bqet41oj0mfc9dw	pdino8tpcml3eup	m60o1f3we1sjcb4	Title	title	SingleLineText	text	\N	\N	\N	\N	f	t	f	f	\N	f	\N	\N	\N	\N	specificType			\N	\N	\N	\N	\N	9	{}	\N	f	wdit5tu4	\N	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00	\N
\.


--
-- Data for Name: nc_comment_reactions; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_comment_reactions (id, row_id, comment_id, source_id, fk_model_id, base_id, reaction, created_by, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_comments; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_comments (id, row_id, comment, created_by, created_by_email, resolved_by, resolved_by_email, parent_comment_id, source_id, base_id, fk_model_id, is_deleted, fk_workspace_id, created_at, updated_at, fk_doc_id, anchor_id) FROM stdin;
\.


--
-- Data for Name: nc_custom_urls_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_custom_urls_v2 (id, fk_workspace_id, base_id, fk_model_id, view_id, original_path, custom_path, fk_dashboard_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_dashboards_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_dashboards_v2 (id, fk_workspace_id, base_id, title, description, meta, "order", created_by, owned_by, uuid, password, fk_custom_url_id, created_at, updated_at, deleted) FROM stdin;
\.


--
-- Data for Name: nc_data_reflection; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_data_reflection (id, fk_workspace_id, username, password, database, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_date_dependency_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_date_dependency_v2 (id, base_id, fk_workspace_id, fk_model_id, fk_start_date_field_id, fk_end_date_field_id, fk_duration_field_id, fk_dependency_linkrow_field_id, dependency_linkrow_role, dependency_connection_type, dependency_buffer_type, dependency_buffer_days, include_weekends, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_db_servers; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_db_servers (id, title, is_shared, max_tenant_count, current_tenant_count, config, conditions, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_dependency_tracker; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_dependency_tracker (id, fk_workspace_id, base_id, source_type, source_id, dependent_type, dependent_id, created_at, updated_at, queryable_field_0, queryable_field_1, meta, queryable_field_2) FROM stdin;
\.


--
-- Data for Name: nc_disabled_models_for_role_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_disabled_models_for_role_v2 (id, source_id, base_id, fk_view_id, role, disabled, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_doc_content_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_doc_content_v2 (fk_doc_id, base_id, fk_workspace_id, content, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_docs_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_docs_v2 (id, base_id, fk_workspace_id, title, meta, "order", parent_id, deleted, has_children, version, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_extensions; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_extensions (id, base_id, fk_user_id, extension_id, title, kv_store, meta, "order", fk_workspace_id, created_at, updated_at, deleted) FROM stdin;
\.


--
-- Data for Name: nc_file_references; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_file_references (id, storage, file_url, file_size, fk_user_id, fk_workspace_id, base_id, source_id, fk_model_id, fk_column_id, is_external, deleted, created_at, updated_at, fk_doc_id, fk_session_id, soft_deleted) FROM stdin;
\.


--
-- Data for Name: nc_filter_exp_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_filter_exp_v2 (id, source_id, base_id, fk_view_id, fk_hook_id, fk_column_id, fk_parent_id, logical_op, comparison_op, value, is_group, "order", comparison_sub_op, fk_link_col_id, fk_value_col_id, fk_parent_column_id, fk_workspace_id, fk_row_color_condition_id, fk_widget_id, meta, created_at, updated_at, enabled, fk_rls_policy_id, fk_level_id, fk_button_col_id) FROM stdin;
\.


--
-- Data for Name: nc_follower; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_follower (fk_user_id, fk_follower_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_form_view_columns_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_form_view_columns_v2 (id, source_id, base_id, fk_view_id, fk_column_id, uuid, label, help, description, required, show, "order", meta, enable_scanner, fk_workspace_id, created_at, updated_at, row_id) FROM stdin;
\.


--
-- Data for Name: nc_form_view_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_form_view_v2 (source_id, base_id, fk_view_id, heading, subheading, success_msg, redirect_url, redirect_after_secs, email, submit_another_form, show_blank_form, uuid, banner_image_url, logo_url, meta, fk_workspace_id, created_at, updated_at, starts_at, expires_at) FROM stdin;
\.


--
-- Data for Name: nc_gallery_view_columns_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_gallery_view_columns_v2 (id, source_id, base_id, fk_view_id, fk_column_id, uuid, label, help, show, "order", fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_gallery_view_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_gallery_view_v2 (source_id, base_id, fk_view_id, next_enabled, prev_enabled, cover_image_idx, fk_cover_image_col_id, cover_image, restrict_types, restrict_size, restrict_number, public, dimensions, responsive_columns, meta, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_gcp_marketplace_accounts; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_gcp_marketplace_accounts (id, procurement_account_id, fk_user_id, state, link_token, link_token_expires_at, meta, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_gcp_marketplace_entitlements; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_gcp_marketplace_entitlements (id, entitlement_id, fk_gcp_account_id, fk_installation_id, plan, state, meta, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_grid_view_columns_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_grid_view_columns_v2 (id, fk_view_id, fk_column_id, source_id, base_id, uuid, label, help, width, show, "order", group_by, group_by_order, group_by_sort, aggregation, fk_workspace_id, created_at, updated_at) FROM stdin;
ncjnm7enmlnh1b5j	vw7ub7lf3z8q9cwv	cvuhtun2njrvjwk	bqet41oj0mfc9dw	pdino8tpcml3eup	\N	\N	\N	200px	t	1	\N	\N	\N	none	wdit5tu4	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00
nck4djw9uj6r9fom	vw7ub7lf3z8q9cwv	c82wd5zgq91v7zv	bqet41oj0mfc9dw	pdino8tpcml3eup	\N	\N	\N	200px	t	2	\N	\N	\N	none	wdit5tu4	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00
ncrl1kbfgc64c9gu	vw7ub7lf3z8q9cwv	c19ye8asc1gjhp8	bqet41oj0mfc9dw	pdino8tpcml3eup	\N	\N	\N	200px	t	3	\N	\N	\N	none	wdit5tu4	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00
ncnadaoefrhvgudl	vw7ub7lf3z8q9cwv	clyzjegm4i1pxcc	bqet41oj0mfc9dw	pdino8tpcml3eup	\N	\N	\N	200px	t	4	\N	\N	\N	none	wdit5tu4	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00
nci7a1bauua2swpk	vw7ub7lf3z8q9cwv	cnujy9xiexdbife	bqet41oj0mfc9dw	pdino8tpcml3eup	\N	\N	\N	200px	t	5	\N	\N	\N	none	wdit5tu4	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00
nc5uojygapi27h0f	vw7ub7lf3z8q9cwv	c1a8zcszemtc59r	bqet41oj0mfc9dw	pdino8tpcml3eup	\N	\N	\N	200px	t	6	\N	\N	\N	none	wdit5tu4	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00
nclld6est2xug6sd	vw7ub7lf3z8q9cwv	crfl2f1v8mhc3lc	bqet41oj0mfc9dw	pdino8tpcml3eup	\N	\N	\N	200px	t	7	\N	\N	\N	none	wdit5tu4	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00
ncocd9e7rrgw8m8f	vw7ub7lf3z8q9cwv	c04uwrhozg7koij	bqet41oj0mfc9dw	pdino8tpcml3eup	\N	\N	\N	200px	t	8	\N	\N	\N	none	wdit5tu4	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00
ncnm0wxm9lgzgmhr	vw7ub7lf3z8q9cwv	c27su3znpb5ibjx	bqet41oj0mfc9dw	pdino8tpcml3eup	\N	\N	\N	200px	t	9	\N	\N	\N	none	wdit5tu4	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00
\.


--
-- Data for Name: nc_grid_view_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_grid_view_v2 (fk_view_id, source_id, base_id, uuid, meta, row_height, fk_workspace_id, created_at, updated_at) FROM stdin;
vw7ub7lf3z8q9cwv	bqet41oj0mfc9dw	pdino8tpcml3eup	\N	\N	\N	wdit5tu4	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00
\.


--
-- Data for Name: nc_hook_logs_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_hook_logs_v2 (id, source_id, base_id, fk_hook_id, type, event, operation, test_call, payload, conditions, notification, error_code, error_message, error, execution_time, response, triggered_by, fk_workspace_id, created_at, updated_at, error_notified_at) FROM stdin;
\.


--
-- Data for Name: nc_hook_trigger_fields; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_hook_trigger_fields (fk_hook_id, fk_column_id, base_id, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_hooks_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_hooks_v2 (id, source_id, base_id, fk_model_id, title, description, env, type, event, operation, async, payload, url, headers, condition, notification, retries, retry_interval, timeout, active, version, trigger_field, fk_workspace_id, created_at, updated_at, deleted) FROM stdin;
\.


--
-- Data for Name: nc_installations; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_installations (id, fk_subscription_id, licensed_to, license_key, installation_secret, installed_at, last_seen_at, expires_at, license_type, status, seat_count, config, meta, created_at, updated_at, fk_user_id, min_seats) FROM stdin;
\.


--
-- Data for Name: nc_integration_links_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_integration_links_v2 (id, fk_integration_id, base_id, fk_workspace_id, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_integrations_store_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_integrations_store_v2 (id, fk_integration_id, type, sub_type, fk_workspace_id, fk_user_id, created_at, updated_at, slot_0, slot_1, slot_2, slot_3, slot_4, slot_5, slot_6, slot_7, slot_8, slot_9) FROM stdin;
\.


--
-- Data for Name: nc_integrations_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_integrations_v2 (id, title, config, meta, type, sub_type, fk_workspace_id, is_private, deleted, created_by, "order", is_default, is_encrypted, is_global, created_at, updated_at, is_restricted) FROM stdin;
\.


--
-- Data for Name: nc_jobs; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_jobs (id, job, status, result, fk_user_id, fk_workspace_id, base_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_kanban_view_columns_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_kanban_view_columns_v2 (id, source_id, base_id, fk_view_id, fk_column_id, uuid, label, help, show, "order", fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_kanban_view_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_kanban_view_v2 (fk_view_id, source_id, base_id, show, "order", uuid, title, public, password, show_all_fields, fk_grp_col_id, fk_cover_image_col_id, meta, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_list_view_columns_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_list_view_columns_v2 (id, base_id, source_id, fk_view_id, fk_column_id, fk_level_id, show, "order", width, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_list_view_levels_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_list_view_levels_v2 (id, fk_view_id, level, fk_model_id, fk_link_column_id, enable_nested_records, fk_self_link_column_id, wrap_headers, meta, base_id, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_list_view_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_list_view_v2 (fk_view_id, base_id, source_id, title, show_empty_parents, row_height, fk_prefix_column_id, meta, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_managed_app_deployment_logs; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_managed_app_deployment_logs (id, fk_workspace_id, base_id, fk_managed_app_id, from_version_id, to_version_id, status, deployment_type, error_message, deployment_log, meta, created_at, updated_at, started_at, completed_at) FROM stdin;
\.


--
-- Data for Name: nc_managed_app_versions; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_managed_app_versions (id, fk_workspace_id, fk_managed_app_id, version, version_number, status, schema, release_notes, created_at, updated_at, published_at) FROM stdin;
\.


--
-- Data for Name: nc_managed_apps; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_managed_apps (id, fk_workspace_id, base_id, title, description, created_by, visibility, category, install_count, meta, deleted, created_at, updated_at, published_at) FROM stdin;
\.


--
-- Data for Name: nc_map_view_columns_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_map_view_columns_v2 (id, base_id, project_id, fk_view_id, fk_column_id, uuid, label, help, show, "order", fk_workspace_id, created_at, updated_at, source_id) FROM stdin;
\.


--
-- Data for Name: nc_map_view_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_map_view_v2 (fk_view_id, source_id, base_id, uuid, title, fk_geo_data_col_id, meta, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_mcp_tokens; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_mcp_tokens (id, title, base_id, token, fk_workspace_id, "order", fk_user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_model_stats_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_model_stats_v2 (fk_workspace_id, fk_model_id, row_count, is_external, base_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_models_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_models_v2 (id, source_id, base_id, table_name, title, type, meta, schema, enabled, mm, tags, pinned, deleted, "order", description, synced, fk_workspace_id, created_by, owned_by, uuid, password, fk_custom_url_id, created_at, updated_at, parent_id, updated_by, has_children, doc_version, trash_disabled, trash_retention_days) FROM stdin;
m60o1f3we1sjcb4	bqet41oj0mfc9dw	pdino8tpcml3eup	Features	Features	table	\N	\N	t	f	\N	\N	\N	1	\N	f	wdit5tu4	\N	\N	\N	\N	\N	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00	\N	\N	f	1	\N	\N
\.


--
-- Data for Name: nc_oauth_authorization_codes; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_oauth_authorization_codes (code, fk_client_id, fk_user_id, code_challenge, code_challenge_method, redirect_uri, scope, state, resource, granted_resources, expires_at, is_used, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_oauth_clients; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_oauth_clients (client_id, client_secret, client_type, client_name, client_description, client_uri, logo_uri, redirect_uris, allowed_grant_types, response_types, allowed_scopes, registration_access_token, registration_client_uri, client_id_issued_at, client_secret_expires_at, fk_user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_oauth_tokens; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_oauth_tokens (id, fk_client_id, fk_user_id, access_token, access_token_expires_at, refresh_token, refresh_token_expires_at, resource, audience, granted_resources, scope, is_revoked, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: nc_org; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_org (id, title, slug, fk_user_id, meta, image, is_share_enabled, deleted, "order", fk_db_instance_id, stripe_customer_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_org_domain; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_org_domain (id, fk_org_id, fk_user_id, domain, verified, txt_value, last_verified, deleted, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_org_users; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_org_users (fk_org_id, fk_user_id, roles, created_at, updated_at, deleted, deleted_at, scim_external_id, scim_managed, scim_user_name, scim_meta) FROM stdin;
\.


--
-- Data for Name: nc_permission_subjects; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_permission_subjects (fk_permission_id, subject_type, subject_id, fk_workspace_id, base_id, created_at, updated_at, hierarchy_scope) FROM stdin;
\.


--
-- Data for Name: nc_permissions; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_permissions (id, fk_workspace_id, base_id, entity, entity_id, permission, created_by, enforce_for_form, enforce_for_automation, granted_type, granted_role, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_plans; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_plans (id, title, description, stripe_product_id, is_active, prices, meta, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_plugins_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_plugins_v2 (id, title, description, active, rating, version, docs, status, status_details, logo, icon, tags, category, input_schema, input, creator, creator_website, price, created_at, updated_at) FROM stdin;
slack	Slack	Slack brings team communication and collaboration into one place so you can get more work done, whether you belong to a large enterprise or a small business. 	f	\N	0.0.1	\N	install	\N	plugins/slack.webp	\N	Chat	Chat	{"title":"Configure Slack","array":true,"items":[{"key":"channel","label":"Channel Name","placeholder":"Channel Name","type":"SingleLineText","required":true},{"key":"webhook_url","label":"Webhook URL","placeholder":"Webhook URL","type":"Password","required":true}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully installed and Slack is enabled for notification.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
ms-teams	Microsoft Teams	Microsoft Teams is for everyone · Instantly go from group chat to video call with the touch of a button.	f	\N	0.0.1	\N	install	\N	plugins/teams.ico	\N	Chat	Chat	{"title":"Configure Microsoft Teams","array":true,"items":[{"key":"channel","label":"Channel Name","placeholder":"Channel Name","type":"SingleLineText","required":true},{"key":"webhook_url","label":"Webhook URL","placeholder":"Webhook URL","type":"Password","required":true}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully installed and Microsoft Teams is enabled for notification.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
discord	Discord	Discord is the easiest way to talk over voice, video, and text. Talk, chat, hang out, and stay close with your friends and communities.	f	\N	0.0.1	\N	install	\N	plugins/discord.png	\N	Chat	Chat	{"title":"Configure Discord","array":true,"items":[{"key":"channel","label":"Channel Name","placeholder":"Channel Name","type":"SingleLineText","required":true},{"key":"webhook_url","label":"Webhook URL","type":"Password","placeholder":"Webhook URL","required":true}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully installed and Discord is enabled for notification.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
twilio-whatsapp	Whatsapp Twilio	With Twilio, unite communications and strengthen customer relationships across your business – from marketing and sales to customer service and operations.	f	\N	0.0.1	\N	install	\N	plugins/whatsapp.png	\N	Chat	Twilio	{"title":"Configure Twilio","items":[{"key":"sid","label":"Account SID","placeholder":"Account SID","type":"SingleLineText","required":true},{"key":"token","label":"Auth Token","placeholder":"Auth Token","type":"Password","required":true},{"key":"from","label":"From Phone Number","placeholder":"From Phone Number","type":"SingleLineText","required":true}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully installed and Whatsapp Twilio is enabled for notification.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
twilio	Twilio	With Twilio, unite communications and strengthen customer relationships across your business – from marketing and sales to customer service and operations.	f	\N	0.0.1	\N	install	\N	plugins/twilio.png	\N	Chat	Twilio	{"title":"Configure Twilio","items":[{"key":"sid","label":"Account SID","placeholder":"Account SID","type":"SingleLineText","required":true},{"key":"token","label":"Auth Token","placeholder":"Auth Token","type":"Password","required":true},{"key":"from","label":"From Phone Number","placeholder":"From Phone Number","type":"SingleLineText","required":true}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully installed and Twilio is enabled for notification.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
aws-s3	S3	Amazon Simple Storage Service (Amazon S3) is an object storage service that offers industry-leading scalability, data availability, security, and performance.	f	\N	0.0.6	\N	install	\N	plugins/s3.png	\N	Storage	Storage	{"title":"Configure Amazon S3","items":[{"key":"bucket","label":"Bucket Name","placeholder":"Bucket Name","type":"SingleLineText","required":true},{"key":"region","label":"Region","placeholder":"Region","type":"SingleLineText","required":true},{"key":"endpoint","label":"Endpoint","placeholder":"Endpoint","type":"SingleLineText","required":false},{"key":"access_key","label":"Access Key","placeholder":"Access Key","type":"SingleLineText","required":false},{"key":"access_secret","label":"Access Secret","placeholder":"Access Secret","type":"Password","required":false},{"key":"acl","label":"Access Control Lists (ACL)","placeholder":"","type":"SingleLineText","required":false},{"key":"force_path_style","label":"Force Path Style","placeholder":"Default set to false","type":"Checkbox","required":false}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully configured! Attachments will now be stored in AWS S3.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
minio	Minio	MinIO is a High Performance Object Storage released under Apache License v2.0. It is API compatible with Amazon S3 cloud storage service.	f	\N	0.0.5	\N	install	\N	plugins/minio.png	\N	Storage	Storage	{"title":"Configure Minio","items":[{"key":"endPoint","label":"Minio Endpoint","placeholder":"Minio Endpoint","type":"SingleLineText","required":true,"help_text":"Hostnames can’t include underscores (_) due to DNS standard limitations. Update the hostname if you see an Invalid endpoint error."},{"key":"port","label":"Port","placeholder":"Port","type":"Number","required":true},{"key":"bucket","label":"Bucket Name","placeholder":"Bucket Name","type":"SingleLineText","required":true},{"key":"access_key","label":"Access Key","placeholder":"Access Key","type":"SingleLineText","required":true},{"key":"access_secret","label":"Access Secret","placeholder":"Access Secret","type":"Password","required":true},{"key":"ca","label":"Ca","placeholder":"Ca","type":"LongText"},{"key":"useSSL","label":"Use SSL","placeholder":"Use SSL","type":"Checkbox","required":false}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully configured! Attachments will now be stored in Minio.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
gcs	GCS	Google Cloud Storage is a RESTful online file storage web service for storing and accessing data on Google Cloud Platform infrastructure.	f	\N	0.0.4	\N	install	\N	plugins/gcs.png	\N	Storage	Storage	{"title":"Configure Google Cloud Storage","items":[{"key":"bucket","label":"Bucket Name","placeholder":"Bucket Name","type":"SingleLineText","required":true},{"key":"client_email","label":"Client Email","placeholder":"Client Email","type":"SingleLineText","required":true},{"key":"private_key","label":"Private Key","placeholder":"Private Key","type":"Password","required":true},{"key":"project_id","label":"Project ID","placeholder":"Project ID","type":"SingleLineText","required":false},{"key":"uniform_bucket_level_access","label":"Uniform Bucket Level Access","type":"Checkbox","required":false}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully configured! Attachments will now be stored in Google Cloud Storage.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
mattermost	Mattermost	Mattermost brings all your team communication into one place, making it searchable and accessible anywhere.	f	\N	0.0.1	\N	install	\N	plugins/mattermost.png	\N	Chat	Chat	{"title":"Configure Mattermost","array":true,"items":[{"key":"channel","label":"Channel Name","placeholder":"Channel Name","type":"SingleLineText","required":true},{"key":"webhook_url","label":"Webhook URL","placeholder":"Webhook URL","type":"Password","required":true}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully installed and Mattermost is enabled for notification.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
spaces	Spaces	Store & deliver vast amounts of content with a simple architecture.	f	\N	0.0.3	\N	install	\N	plugins/spaces.svg	\N	Storage	Storage	{"title":"DigitalOcean Spaces","items":[{"key":"bucket","label":"Bucket Name","placeholder":"Bucket Name","type":"SingleLineText","required":true},{"key":"region","label":"Region","placeholder":"Region","type":"SingleLineText","required":true},{"key":"access_key","label":"Access Key","placeholder":"Access Key","type":"SingleLineText","required":true},{"key":"access_secret","label":"Access Secret","placeholder":"Access Secret","type":"Password","required":true},{"key":"acl","label":"Access Control Lists (ACL)","placeholder":"Default set to public-read","type":"SingleLineText","required":false}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully configured! Attachments will now be stored in DigitalOcean Spaces.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
backblaze	Backblaze	Backblaze B2 is enterprise-grade, S3 compatible storage that companies around the world use to store and serve data while improving their cloud OpEx vs. Amazon S3 and others.	f	\N	0.0.6	\N	install	\N	plugins/backblaze.png	\N	Storage	Storage	{"title":"Configure Backblaze B2","items":[{"key":"bucket","label":"Bucket Name","placeholder":"Bucket Name","type":"SingleLineText","required":true},{"key":"region","label":"Region","placeholder":"e.g. us-west-001","type":"SingleLineText","required":true},{"key":"access_key","label":"Access Key","placeholder":"i.e. keyID in App Keys","type":"SingleLineText","required":true},{"key":"access_secret","label":"Access Secret","placeholder":"i.e. applicationKey in App Keys","type":"Password","required":true},{"key":"acl","label":"Access Control Lists (ACL)","placeholder":"Default set to public-read","type":"SingleLineText","required":false}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully configured! Attachments will now be stored in Backblaze B2.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
vultr	Vultr	Using Vultr Object Storage can give flexibility and cloud storage that allows applications greater flexibility and access worldwide.	f	\N	0.0.4	\N	install	\N	plugins/vultr.png	\N	Storage	Storage	{"title":"Configure Vultr Object Storage","items":[{"key":"bucket","label":"Bucket Name","placeholder":"Bucket Name","type":"SingleLineText","required":true},{"key":"hostname","label":"Host Name","placeholder":"e.g.: ewr1.vultrobjects.com","type":"SingleLineText","required":true},{"key":"access_key","label":"Access Key","placeholder":"Access Key","type":"SingleLineText","required":true},{"key":"access_secret","label":"Access Secret","placeholder":"Access Secret","type":"Password","required":true},{"key":"acl","label":"Access Control Lists (ACL)","placeholder":"Default set to public-read","type":"SingleLineText","required":false}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully configured! Attachments will now be stored in Vultr Object Storage.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
ovh	Ovh	Upload your files to a space that you can access via HTTPS using the OpenStack Swift API, or the S3 API. 	f	\N	0.0.4	\N	install	\N	plugins/ovhCloud.png	\N	Storage	Storage	{"title":"Configure OvhCloud Object Storage","items":[{"key":"bucket","label":"Bucket Name","placeholder":"Bucket Name","type":"SingleLineText","required":true},{"key":"region","label":"Region","placeholder":"Region","type":"SingleLineText","required":true},{"key":"access_key","label":"Access Key","placeholder":"Access Key","type":"SingleLineText","required":true},{"key":"access_secret","label":"Access Secret","placeholder":"Access Secret","type":"Password","required":true},{"key":"acl","label":"Access Control Lists (ACL)","placeholder":"Default set to public-read","type":"SingleLineText","required":false}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully configured! Attachments will now be stored in OvhCloud Object Storage.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
linode	Linode	S3-compatible Linode Object Storage makes it easy and more affordable to manage unstructured data such as content assets, as well as sophisticated and data-intensive storage challenges around artificial intelligence and machine learning.	f	\N	0.0.4	\N	install	\N	plugins/linode.svg	\N	Storage	Storage	{"title":"Configure Linode Object Storage","items":[{"key":"bucket","label":"Bucket Name","placeholder":"Bucket Name","type":"SingleLineText","required":true},{"key":"region","label":"Region","placeholder":"Region","type":"SingleLineText","required":true},{"key":"access_key","label":"Access Key","placeholder":"Access Key","type":"SingleLineText","required":true},{"key":"access_secret","label":"Access Secret","placeholder":"Access Secret","type":"Password","required":true},{"key":"acl","label":"Access Control Lists (ACL)","placeholder":"Default set to public-read","type":"SingleLineText","required":false}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully configured! Attachments will now be stored in Linode Object Storage.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
upcloud	UpCloud	The perfect home for your data. Thanks to the S3-compatible programmable interface,\nyou have a host of options for existing tools and code implementations.\n	f	\N	0.0.4	\N	install	\N	plugins/upcloud.png	\N	Storage	Storage	{"title":"Configure UpCloud Object Storage","items":[{"key":"bucket","label":"Bucket Name","placeholder":"Bucket Name","type":"SingleLineText","required":true},{"key":"endpoint","label":"Endpoint","placeholder":"Endpoint","type":"SingleLineText","required":true},{"key":"access_key","label":"Access Key","placeholder":"Access Key","type":"SingleLineText","required":true},{"key":"access_secret","label":"Access Secret","placeholder":"Access Secret","type":"Password","required":true},{"key":"acl","label":"Access Control Lists (ACL)","placeholder":"Default set to public-read","type":"SingleLineText","required":false}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully configured! Attachments will now be stored in UpCloud Object Storage.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
smtp	SMTP	SMTP email client	f	\N	0.0.6	\N	install	\N	\N	ncMail	Email	Email	{"title":"Configure Email SMTP","items":[{"key":"from","label":"From address","placeholder":"admin@example.com","type":"SingleLineText","required":true,"help_text":"Enter the e-mail address to be used as the sender (appearing in the 'From' field of sent e-mails)."},{"key":"host","label":"SMTP server","placeholder":"smtp.example.com","help_text":"Enter the SMTP hostname. If you do not have this information available, contact your email service provider.","type":"SingleLineText","required":true},{"key":"name","label":"From domain","placeholder":"your-domain.com","type":"SingleLineText","required":true,"help_text":"Specify the domain name that will be used in the 'From' address (e.g., yourdomain.com). This should match the domain of the 'From' address."},{"key":"port","label":"SMTP port","placeholder":"Port","type":"SingleLineText","required":true,"help_text":"Enter the port number used by the SMTP server (e.g., 587 for TLS, 465 for SSL, or 25 for insecure connections)."},{"key":"username","label":"Username","placeholder":"Username","type":"SingleLineText","required":false,"help_text":"Enter the username to authenticate with the SMTP server. This is usually your email address."},{"key":"password","label":"Password","placeholder":"Password","type":"Password","required":false,"help_text":"Enter the password associated with the SMTP server username. Click the eye icon to view the password as you type"},{"key":"secure","label":"Use secure connection","placeholder":"Secure","type":"Checkbox","required":false,"help_text":"Enable this if your SMTP server requires a secure connection (SSL/TLS)."},{"key":"ignoreTLS","label":"Ignore TLS errors","placeholder":"Ignore TLS","type":"Checkbox","required":false,"help_text":"Enable this if you want to ignore any TLS errors that may occur during the connection. Enabling this disables STARTTLS even if SMTP servers support it, hence may compromise security."},{"key":"rejectUnauthorized","label":"Reject unauthorized","placeholder":"Reject unauthorized","type":"Checkbox","required":false,"help_text":"Disable this to allow connecting to an SMTP server that uses a self‑signed or otherwise invalid TLS certificate."}],"actions":[{"label":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully installed and email notification will use SMTP configuration","msgOnUninstall":"","docs":[]}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
mailersend	MailerSend	MailerSend email client	f	\N	0.0.2	\N	install	\N	plugins/mailersend.svg	\N	Email	Email	{"title":"Configure MailerSend","items":[{"key":"api_key","label":"API key","placeholder":"eg: ***************","type":"Password","required":true},{"key":"from","label":"From","placeholder":"eg: admin@run.com","type":"SingleLineText","required":true},{"key":"from_name","label":"From name","placeholder":"eg: Adam","type":"SingleLineText","required":true}],"actions":[{"label":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully configured! Email notifications are now set up using MailerSend.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
scaleway	Scaleway	Scaleway Object Storage is an S3-compatible object store from Scaleway Cloud Platform.	f	\N	0.0.4	\N	install	\N	plugins/scaleway.png	\N	Storage	Storage	{"title":"Setup Scaleway","items":[{"key":"bucket","label":"Bucket name","placeholder":"Bucket name","type":"SingleLineText","required":true},{"key":"region","label":"Region of bucket","placeholder":"Region of bucket","type":"SingleLineText","required":true},{"key":"access_key","label":"Access Key","placeholder":"Access Key","type":"SingleLineText","required":true},{"key":"access_secret","label":"Access Secret","placeholder":"Access Secret","type":"Password","required":true},{"key":"acl","label":"Access Control Lists (ACL)","placeholder":"Default set to public-read","type":"SingleLineText","required":false}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully configured! Attachments will now be stored in Scaleway Object Storage.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
ses	SES	Amazon Simple Email Service (SES) is a cost-effective, flexible, and scalable email service that enables developers to send mail from within any application.	f	\N	0.0.4	\N	install	\N	plugins/aws.png	NcAmazonAws	Email	Email	{"title":"Configure Amazon Simple Email Service (SES)","items":[{"key":"from","label":"From","placeholder":"From","type":"SingleLineText","required":true},{"key":"region","label":"Region","placeholder":"Region","type":"SingleLineText","required":true},{"key":"access_key","label":"Access Key","placeholder":"Access Key","type":"SingleLineText","required":true},{"key":"access_secret","label":"Access Secret","placeholder":"Access Secret","type":"Password","required":true}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully configured! Email notifications are now set up using Amazon SES.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
cloudflare-r2	Cloudflare R2	Cloudflare R2 is an S3-compatible, zero egress-fee, globally distributed object storage.	f	\N	0.0.3	\N	install	\N	plugins/r2.png	\N	Storage	Storage	{"title":"Configure Cloudflare R2 Storage","items":[{"key":"bucket","label":"Bucket Name","placeholder":"Bucket Name","type":"SingleLineText","required":true},{"key":"hostname","label":"Host Name","placeholder":"e.g.: *****.r2.cloudflarestorage.com","type":"SingleLineText","required":true},{"key":"access_key","label":"Access Key","placeholder":"Access Key","type":"SingleLineText","required":true},{"key":"access_secret","label":"Access Secret","placeholder":"Access Secret","type":"Password","required":true}],"actions":[{"label":"Test","placeholder":"Test","key":"test","actionType":"TEST","type":"Button"},{"label":"Save","placeholder":"Save","key":"save","actionType":"SUBMIT","type":"Button"}],"msgOnInstall":"Successfully configured! Attachments will now be stored in Cloudflare R2 Storage.","msgOnUninstall":""}	\N	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
\.


--
-- Data for Name: nc_principal_assignments; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_principal_assignments (resource_type, resource_id, principal_type, principal_ref_id, roles, deleted, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_record_templates; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_record_templates (id, base_id, fk_workspace_id, fk_model_id, title, description, template_data, usage_count, enabled, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_rls_policies; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_rls_policies (id, fk_workspace_id, base_id, source_id, fk_model_id, title, enabled, is_default, default_behavior, "order", meta, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_rls_policy_subjects; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_rls_policy_subjects (fk_rls_policy_id, subject_type, subject_id, fk_workspace_id, base_id, created_at, updated_at, hierarchy_scope) FROM stdin;
\.


--
-- Data for Name: nc_row_color_conditions; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_row_color_conditions (id, fk_view_id, fk_workspace_id, base_id, color, nc_order, is_set_as_background, created_at, updated_at, type, fk_target_column_id) FROM stdin;
\.


--
-- Data for Name: nc_sandbox_changelog; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_sandbox_changelog (id, seq, fk_sandbox_id, base_id, event, entity_type, entity_id, entity_title, parent_entity_id, parent_entity_title, created_by, description, meta, status, merged_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_sandboxes_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_sandboxes_v2 (id, fk_workspace_id, production_base_id, sandbox_base_id, created_by, meta, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_scim_config; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_scim_config (id, enabled, provisioning_token, role_mapping, created_at, updated_at, default_role, fk_org_id) FROM stdin;
\.


--
-- Data for Name: nc_scripts; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_scripts (id, title, description, meta, "order", base_id, fk_workspace_id, script, config, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_snapshots; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_snapshots (id, title, base_id, snapshot_base_id, fk_workspace_id, created_by, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_sort_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_sort_v2 (id, source_id, base_id, fk_view_id, fk_column_id, direction, "order", fk_workspace_id, created_at, updated_at, fk_level_id) FROM stdin;
\.


--
-- Data for Name: nc_sources_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_sources_v2 (id, base_id, alias, config, meta, is_meta, type, inflection_column, inflection_table, enabled, "order", description, erd_uuid, deleted, is_schema_readonly, is_data_readonly, is_local, fk_sql_executor_id, fk_workspace_id, fk_integration_id, is_encrypted, created_at, updated_at) FROM stdin;
bqet41oj0mfc9dw	pdino8tpcml3eup	\N	{"schema":"pdino8tpcml3eup"}	\N	f	pg	camelize	camelize	t	1	\N	\N	f	f	f	t	\N	wdit5tu4	\N	f	2026-05-09 10:51:38+00	2026-05-09 10:51:38+00
\.


--
-- Data for Name: nc_sql_executor_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_sql_executor_v2 (id, domain, status, priority, capacity, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_sso_client; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_sso_client (id, type, title, enabled, config, fk_user_id, fk_org_id, deleted, "order", domain_name, domain_name_verified, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_sso_client_domain; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_sso_client_domain (fk_sso_client_id, fk_org_domain_id, enabled, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_store; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_store (id, base_id, db_alias, key, value, type, env, tag, created_at, updated_at) FROM stdin;
1	\N	db	NC_MIGRATION_JOBS	{"version":"12","stall_check":1778310795986,"locked":false}	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
2	\N	db	nc_server_id	a164d1878cf0a35923082dc675df6198e901aa6cd3d2fe576e8abfd844a76cbc	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
3	\N	db	NC_CONFIG_MAIN	{"version":"0258003"}	\N	\N	\N	2026-05-09 07:13:20+00	2026-05-09 07:13:20+00
4	\N	db	NC_DEFAULT_WORKSPACE_ID	wdit5tu4	\N	\N	\N	2026-05-09 10:51:38+00	2026-05-09 10:51:38+00
\.


--
-- Data for Name: nc_subscriptions; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_subscriptions (id, fk_workspace_id, fk_org_id, fk_plan_id, fk_user_id, stripe_subscription_id, stripe_price_id, seat_count, status, billing_cycle_anchor, start_at, trial_end_at, canceled_at, period, upcoming_invoice_at, upcoming_invoice_due_at, upcoming_invoice_amount, upcoming_invoice_currency, stripe_schedule_id, schedule_phase_start, schedule_stripe_price_id, schedule_fk_plan_id, schedule_period, schedule_type, meta, created_at, updated_at, last_paid_seat_count) FROM stdin;
\.


--
-- Data for Name: nc_sync_configs; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_sync_configs (id, fk_workspace_id, base_id, fk_integration_id, fk_model_id, sync_type, sync_trigger, sync_trigger_cron, sync_trigger_secret, sync_job_id, last_sync_at, next_sync_at, title, sync_category, fk_parent_sync_config_id, on_delete_action, created_at, updated_at, created_by, updated_by, meta) FROM stdin;
\.


--
-- Data for Name: nc_sync_logs_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_sync_logs_v2 (id, base_id, fk_sync_source_id, time_taken, status, status_details, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_sync_mappings; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_sync_mappings (id, fk_workspace_id, base_id, fk_sync_config_id, target_table, fk_model_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_sync_source_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_sync_source_v2 (id, title, type, details, deleted, enabled, "order", base_id, fk_user_id, source_id, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_teams; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_teams (id, title, meta, fk_org_id, fk_workspace_id, created_by, deleted, created_at, updated_at, scim_external_id, scim_managed, scim_display_name, scim_meta, fk_parent_team_id, depth, path) FROM stdin;
\.


--
-- Data for Name: nc_timeline_view_columns_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_timeline_view_columns_v2 (id, base_id, source_id, fk_view_id, fk_column_id, show, bold, underline, italic, "order", group_by, group_by_order, group_by_sort, aggregation, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_timeline_view_range_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_timeline_view_range_v2 (id, fk_view_id, fk_from_column_id, fk_to_column_id, label, base_id, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_timeline_view_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_timeline_view_v2 (fk_view_id, base_id, source_id, title, meta, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_trash; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_trash (id, name, parent_name, resource_type, resource_id, parent_type, parent_id, deleted_by, deleted_at, cleanup_due_at, related_items, meta, created_at, updated_at, fk_workspace_id, base_id) FROM stdin;
\.


--
-- Data for Name: nc_usage_stats; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_usage_stats (fk_workspace_id, usage_type, period_start, count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_user_comment_notifications_preference; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_user_comment_notifications_preference (id, row_id, user_id, fk_model_id, source_id, base_id, preferences, fk_workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_user_refresh_tokens; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_user_refresh_tokens (fk_user_id, token, meta, expires_at, created_at, updated_at) FROM stdin;
us01zuvdfry4xe7g	2fb67159e8a1fe857cf540582fa3240598ea60ee4412dcb2b7ad28704400da50d50e3b39b3a9bea1	\N	2026-06-08 10:51:39.229+00	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00
\.


--
-- Data for Name: nc_users_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_users_v2 (id, email, password, salt, invite_token, invite_token_expires, reset_password_expires, reset_password_token, email_verification_token, email_verified, roles, token_version, blocked, blocked_reason, deleted_at, is_deleted, meta, display_name, user_name, bio, location, website, avatar, is_new_user, created_at, updated_at, canonical_email, stripe_customer_id, totp_secret, totp_enabled, totp_backup_codes) FROM stdin;
us01zuvdfry4xe7g	cruz@snrglabs.com	$2a$10$VsK3hg9fn2x0FtQP.zrIAujyIydynNT63xY8R8yj0c3p9DbbwRsHC	$2a$10$VsK3hg9fn2x0FtQP.zrIAu	\N	\N	\N	\N	ae5c0a11-5140-435c-b196-426a04ffbf5d	\N	org-level-creator,super	2fe29eecf3af89b1b9ddd6fdaba365ccb222296dd520484b38a4bcc00d3830dcf48dfaae9b95e449	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	f	2026-05-09 10:51:38+00	2026-05-09 10:51:59+00	cruz@snrglabs.com	\N	\N	f	\N
\.


--
-- Data for Name: nc_view_sections; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_view_sections (id, fk_workspace_id, base_id, source_id, fk_model_id, title, "order", meta, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nc_views_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_views_v2 (id, source_id, base_id, fk_model_id, title, type, is_default, show_system_fields, lock_type, uuid, password, show, "order", meta, description, created_by, owned_by, fk_workspace_id, attachment_mode_column_id, expanded_record_mode, fk_custom_url_id, row_coloring_mode, created_at, updated_at, fk_view_section_id, deleted) FROM stdin;
vw7ub7lf3z8q9cwv	bqet41oj0mfc9dw	pdino8tpcml3eup	m60o1f3we1sjcb4	Features	3	\N	\N	collaborative	\N	\N	t	1	{}	\N	\N	\N	wdit5tu4	\N	field	\N	\N	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00	\N	\N
\.


--
-- Data for Name: nc_widgets_v2; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_widgets_v2 (id, fk_workspace_id, base_id, fk_dashboard_id, fk_model_id, fk_view_id, title, description, type, config, meta, "order", "position", error, created_at, updated_at, deleted) FROM stdin;
\.


--
-- Data for Name: nc_workflows; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.nc_workflows (id, title, description, fk_workspace_id, base_id, enabled, nodes, edges, meta, "order", created_by, updated_by, created_at, updated_at, draft) FROM stdin;
\.


--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.notification (id, type, body, is_read, is_deleted, fk_user_id, created_at, updated_at) FROM stdin;
nco292tloogoczdn	app.welcome	{}	f	f	us01zuvdfry4xe7g	2026-05-09 10:51:39+00	2026-05-09 10:51:39+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.notifications (id, user_id, type, title, body, link, is_read, created_at, read_at) FROM stdin;
\.


--
-- Data for Name: outlook_calendar_events_cache; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.outlook_calendar_events_cache (id, connection_id, user_id, outlook_event_id, subject, body_preview, organizer_name, organizer_email, location, web_link, start_time, end_time, is_all_day, response_status, raw, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: requests; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.requests (id, request_id, title, requester, category, priority, status, description, assigned_reviewer, submitted_date, updated_at, linked_form_id, linked_task_id, request_number, assignee, updated_by) FROM stdin;
1	REQ-2026-001	Purchase Order - Office Supplies	Callie Brooks	Purchase Order	high	under_review	Need printer paper, pens, and folders for the front office.	Cathy Kraft	2026-05-09 16:00:00+00	2026-05-10 19:39:42.6536+00	\N	\N	REQ-2026-001	\N	\N
2	REQ-2026-002	Vehicle Request - Site Visit	Jayden Ellis	Vehicle Request	normal	approved	Need a company truck for Wednesday site inspection.	Jordan Strasser	2026-05-08 21:30:00+00	2026-05-10 19:39:42.6536+00	\N	\N	REQ-2026-002	\N	\N
3	REQ-2026-003	IT Access - New Employee	Luis Moreno	IT Access	urgent	submitted	New hire needs email, VPN, and software licenses.	Cathy Kraft	2026-05-08 18:15:00+00	2026-05-10 19:39:42.6536+00	\N	\N	REQ-2026-003	\N	\N
4	REQ-2026-004	Time Off Request - Memorial Day	Sarah Kim	Time Off	low	denied	Requesting Monday off for Memorial Day travel.	Jill Strasser	2026-05-07 23:00:00+00	2026-05-10 19:39:42.6536+00	\N	\N	REQ-2026-004	\N	\N
5	REQ-2026-005	Maintenance - HVAC Unit 2	Marcus Lee	Maintenance Request	high	under_review	AC unit in the back office is not cooling properly.	Terry Strasser	2026-05-07 15:45:00+00	2026-05-10 19:39:42.6536+00	\N	\N	REQ-2026-005	\N	\N
6	REQ-2026-006	Supply Reorder - Safety Gear	Olivia Turner	Supply Reorder	normal	completed	Hard hats and vests running low. Need 12 sets restocked.	Jordan Strasser	2026-05-06 17:00:00+00	2026-05-10 19:39:42.6536+00	\N	\N	REQ-2026-006	\N	\N
7	REQ-2026-007	HR Request - Pay Stub Correction	Carlos Vega	HR / Employee	high	submitted	Pay stub from April 25 has incorrect hours. Please review.	Cathy Kraft	2026-05-06 20:20:00+00	2026-05-10 19:39:42.6536+00	\N	\N	REQ-2026-007	\N	\N
8	REQ-2026-008	Facility Request - Break Room Repair	Natalie Brooks	Facility	normal	approved	Break room microwave needs replacement.	Terry Strasser	2026-05-05 16:00:00+00	2026-05-10 19:39:42.6536+00	\N	\N	REQ-2026-008	\N	\N
9	REQ-2026-009	Training Request - OSHA Refresher	Derek Santos	Training	low	approved	Team is due for annual OSHA safety refresher course.	Jordan Strasser	2026-05-04 22:00:00+00	2026-05-10 19:39:42.6536+00	\N	\N	REQ-2026-009	\N	\N
10	REQ-2026-010	IT Access - Contractor Portal	Amanda Price	IT Access	normal	completed	Contractor needs temporary portal access for 2-week project.	Cathy Kraft	2026-05-03 18:00:00+00	2026-05-10 19:39:42.6536+00	\N	\N	REQ-2026-010	\N	\N
11	REQ-2026-011	IT Access - Investigation Bot	Investigation Bot	IT Access	high	submitted	Schema compatibility validation request	Cathy Kraft	2026-05-10 20:07:09.361086+00	2026-05-10 20:07:09.361086+00	\N	\N	REQ-2026-011	\N	\N
\.


--
-- Data for Name: sop_approvals; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.sop_approvals (id, sop_run_id, sop_step_id, requested_by, approver_id, status, comment, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: sop_run_steps; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.sop_run_steps (id, sop_run_id, sop_step_id, step_order, status, notes, evidence_url, completed_by, completed_at, created_at, updated_at) FROM stdin;
b571556f-8c7f-424c-9981-7943ef992911	39e429e8-2379-4272-b20a-e30a7fe9b9e2	3	3	pending	\N	\N	\N	\N	2026-05-18 12:46:26.907257+00	2026-05-18 12:46:26.907257+00
1202509b-a7d4-4fc9-bb48-531b4f0a22a4	39e429e8-2379-4272-b20a-e30a7fe9b9e2	4	4	pending	\N	\N	\N	\N	2026-05-18 12:46:26.907257+00	2026-05-18 12:46:26.907257+00
7c03ffdd-13de-4c44-9eee-b38b40928de0	39e429e8-2379-4272-b20a-e30a7fe9b9e2	5	5	pending	\N	\N	\N	\N	2026-05-18 12:46:26.907257+00	2026-05-18 12:46:26.907257+00
29e75c2b-fb55-4cbb-b056-596c65a18a1f	39e429e8-2379-4272-b20a-e30a7fe9b9e2	6	6	pending	\N	\N	\N	\N	2026-05-18 12:46:26.907257+00	2026-05-18 12:46:26.907257+00
1a478a81-6c2d-41c3-944a-dd6fea5368ee	39e429e8-2379-4272-b20a-e30a7fe9b9e2	7	7	pending	\N	\N	\N	\N	2026-05-18 12:46:26.907257+00	2026-05-18 12:46:26.907257+00
6f037178-81e4-483a-a27a-8fa99e507d82	39e429e8-2379-4272-b20a-e30a7fe9b9e2	1	1	completed	Confirmed caller details and warranty concern.	\N	13	2026-05-18 12:46:44.568495+00	2026-05-18 12:46:26.907257+00	2026-05-18 12:46:44.568495+00
2ef40dab-ce5b-4e29-844b-fe5cb7277533	39e429e8-2379-4272-b20a-e30a7fe9b9e2	2	2	in_progress	\N	\N	\N	\N	2026-05-18 12:46:26.907257+00	2026-05-18 12:47:02.465876+00
\.


--
-- Data for Name: sop_runs; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.sop_runs (id, sop_id, assigned_to, started_by, current_step_id, status, state_json, wait_json, blocked_reason, revision, started_at, completed_at, updated_at) FROM stdin;
39e429e8-2379-4272-b20a-e30a7fe9b9e2	11	13	13	2	running	{}	{}	\N	4	2026-05-18 12:46:26.907257+00	\N	2026-05-18 12:47:02.464153+00
\.


--
-- Data for Name: sop_steps; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.sop_steps (id, sop_id, step_order, title, instructions, required_role, requires_evidence, requires_approval, estimated_minutes, branch_condition, created_at, updated_at) FROM stdin;
1	11	1	Receive Warranty Call	Answer call promptly and identify the nature of the inquiry as warranty-related. Verify if this is a new issue or a follow-up. Record the caller’s full name, phone number, and a brief description of the problem. Politely set expectations that next steps will be communicated shortly.	Office/Admin	f	f	2	\N	2026-05-18 12:45:31.382778+00	2026-05-18 12:45:31.382778+00
2	11	2	Confirm Customer and Job Details	Retrieve the customer account using the provided phone number or name. Confirm the job address, original installation/service date, and warranty coverage terms. Note any exclusions or expired coverage. If coverage is uncertain, flag for manager review later.	Office/Admin	f	f	3	\N	2026-05-18 12:45:31.382778+00	2026-05-18 12:45:31.382778+00
3	11	3	Review Work Order History	Access prior work orders for the garage door or opener. Look for recurring issues, technician notes, parts replaced, and dates of service. Determine if the current problem may be related to previous work. Document findings in the call notes.	Office/Admin	f	f	3	\N	2026-05-18 12:45:31.382778+00	2026-05-18 12:45:31.382778+00
4	11	4	Request Photos or Video	If the issue is visually assessable (e.g., misalignment, damage, unusual noise), ask the customer to send clear photos or a short video to the designated department email or text number. Explain that this will speed up diagnosis and scheduling. Attach received media to the customer profile and note them in the call record.	Office/Admin	t	f	5	\N	2026-05-18 12:45:31.382778+00	2026-05-18 12:45:31.382778+00
5	11	5	Document and Assign Follow-Up Task	Create an internal follow-up task detailing the warranty concern, coverage status, work order history, and any attached media. Assign it to the dispatcher or service manager for scheduling a warranty inspection. Set a due date no later than the next business day.	Office/Admin	f	f	3	\N	2026-05-18 12:45:31.382778+00	2026-05-18 12:45:31.382778+00
6	11	6	Escalate for Manager Approval	When warranty coverage is unclear, work order history indicates possible customer abuse or non-covered issues, or the request falls outside standard terms, escalate the case to the Service Manager. Attach all relevant documentation and await written approval or denial before proceeding with scheduling.	Office/Admin	f	t	5	\N	2026-05-18 12:45:31.382778+00	2026-05-18 12:45:31.382778+00
7	11	7	Communicate Next Steps to Customer	After warranty status and scheduling plan are confirmed, contact the customer to explain the decision, next steps, and estimated time frame for the technician visit. If any non-covered charges may apply, disclose them at this stage. Record a summary of the conversation in the customer’s record.	Office/Admin	f	f	3	\N	2026-05-18 12:45:31.382778+00	2026-05-18 12:45:31.382778+00
8	12	1	Confirm Customer Details	Collect and verify customer’s full name, service address, phone number, email, and original installation date. Cross-reference with system records to ensure identity. If discrepancies exist, flag for manager review before proceeding.	\N	f	f	5	\N	2026-05-18 15:35:32.80328+00	2026-05-18 15:35:32.80328+00
9	12	2	Verify Original Work Order	Retrieve the original work order and any prior service history. Confirm warranty coverage period, terms, and any exclusions. Document the work order number and coverage status in the triage log. If the warranty has expired or terms are unclear, prepare for escalation.	\N	t	f	10	\N	2026-05-18 15:35:32.80328+00	2026-05-18 15:35:32.80328+00
10	12	3	Request and Collect Evidence/Photos	Instruct the customer to provide clear photos or videos of the reported issue, including wide-angle and close-up views, as well as any relevant context (e.g., door fully open/closed, visible damage). Provide a secure upload link or email. Verify that submitted evidence meets documentation standards before proceeding.	\N	t	f	15	\N	2026-05-18 15:35:32.80328+00	2026-05-18 15:35:32.80328+00
11	12	4	Classify Urgency and Scope	Assess the reported issue against warranty coverage and internal risk matrix. Classify as Critical (safety hazard, inability to secure premises), High (major functional failure affecting daily use), Normal (minor functional or cosmetic), or Low (informational, no immediate action needed). For any Critical classification, immediate manager verification is required. Record classification rationale in the triage log.	\N	f	t	10	\N	2026-05-18 15:35:32.80328+00	2026-05-18 15:35:32.80328+00
12	12	5	Assign Ownership	Assign the case to a qualified technician or service team based on urgency, skill requirements, and current workload. Update the dispatch board or internal system with the assigned owner and expected follow-up timeframe. Notify the assigned individual via standard communication channel.	\N	f	f	10	\N	2026-05-18 15:35:32.80328+00	2026-05-18 15:35:32.80328+00
13	12	6	Escalate Edge Cases for Manager Review	Any case where warranty applicability is ambiguous, customer is actively dissatisfied, out-of-policy concessions are requested, or a Critical classification has been made must be escalated to a manager. Prepare a summary with work order details, evidence, classification, and proposed resolution. Manager review and signoff is required before further action.	Manager	t	t	15	\N	2026-05-18 15:35:32.80328+00	2026-05-18 15:35:32.80328+00
14	12	7	Document and Log Triage Outcome	Record final triage outcome, next steps, assigned owner, and any manager approvals in the central system. Attach all collected evidence, customer communications, and work order references. Confirm that the case is properly flagged for follow-up according to urgency. This log serves as the audit trail for the entire triage process.	\N	t	f	5	\N	2026-05-18 15:35:32.80328+00	2026-05-18 15:35:32.80328+00
\.


--
-- Data for Name: sops; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.sops (id, title, category, owner, status, content, version, last_updated, created_at, department, created_by, updated_at, description) FROM stdin;
6	SOP-001: New Employee Onboarding	HR	6	active	Step 1: Complete I-9 and W-4 forms. Step 2: Issue access badge and parking pass. Step 3: Assign equipment and workstation. Step 4: Schedule orientation with department lead. Step 5: Add to payroll and benefits system.	2.1	2026-05-09 14:14:47.295114+00	2026-05-09 14:14:47.295114+00	\N	\N	2026-05-18 11:38:33.37431+00	\N
7	SOP-002: Work Order Submission	Operations	1	active	Step 1: Identify the issue and location. Step 2: Log into Diversified OS and navigate to Work Orders. Step 3: Click New Work Order and fill all required fields. Step 4: Assign priority and owner. Step 5: Submit — supervisor notified automatically.	1.3	2026-05-09 14:14:47.295114+00	2026-05-09 14:14:47.295114+00	\N	\N	2026-05-18 11:38:33.37431+00	\N
8	SOP-003: Inventory Reorder Process	Logistics	3	active	Step 1: Check inventory dashboard for items below reorder threshold. Step 2: Generate reorder list. Step 3: Submit purchase request via Forms Center. Step 4: Await approval from Operations Manager. Step 5: Receive shipment and update inventory count.	1.0	2026-05-09 14:14:47.295114+00	2026-05-09 14:14:47.295114+00	\N	\N	2026-05-18 11:38:33.37431+00	\N
9	SOP-004: Safety Incident Reporting	Safety	1	under_review	Step 1: Ensure all parties are safe and call 911 if needed. Step 2: Notify direct supervisor immediately. Step 3: Complete incident report form within 24 hours. Step 4: Submit to HR for OSHA recordkeeping. Step 5: Follow up with corrective action plan.	1.1	2026-05-09 14:14:47.295114+00	2026-05-09 14:14:47.295114+00	\N	\N	2026-05-18 11:38:33.37431+00	\N
10	SOP-005: Vehicle Fleet Checkout	Fleet	2	active	Step 1: Check vehicle availability in fleet schedule. Step 2: Complete pre-trip inspection checklist. Step 3: Log mileage and destination in fleet log. Step 4: Report any damage or issues on return. Step 5: Return keys to designated lockbox.	1.2	2026-05-09 14:14:47.295114+00	2026-05-09 14:14:47.295114+00	\N	\N	2026-05-18 11:38:33.37431+00	\N
11	Garage Door Warranty Call Intake	Customer Follow-Up	13	draft	\N	1.0	2026-05-18 12:45:31.382778+00	2026-05-18 12:45:31.382778+00	Operations	13	2026-05-18 12:45:31.382778+00	Internal procedure for receiving and processing a warranty call, confirming customer/job details, reviewing work order history, collecting documentation, assigning follow-up, and escalating for manager approval when necessary.
12	Warranty Follow-Up Triage SOP	Office Procedures	13	draft	\N	1.0	2026-05-18 15:35:32.80328+00	2026-05-18 15:35:32.80328+00	Operations	13	2026-05-18 15:35:32.80328+00	Standard procedure for initial triage of incoming warranty follow-up requests, ensuring consistent customer verification, work order validation, evidence collection, urgency classification, ownership assignment, and appropriate escalation of edge cases.
\.


--
-- Data for Name: system_audit_logs; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.system_audit_logs (id, actor_user_id, action, module, record_id, metadata, created_at) FROM stdin;
1	\N	setting.updated	settings	notification_preferences	{"key": "notification_preferences", "category": "notifications", "actorUserId": 12}	2026-05-14 08:52:11.843001+00
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.system_settings (id, key, value, category, description, is_public, updated_by, updated_at, created_at) FROM stdin;
2	client_visible_modules	{"SOPs": "visible", "Admin": "visible", "Files": "visible", "Forms": "visible", "Tasks": "visible", "AI Chat": "visible", "Reports": "visible", "Calendar": "visible", "Requests": "visible", "Settings": "visible", "Dashboard": "visible", "Documents": "visible", "Employees": "visible", "Inventory": "visible", "Timeclock": "visible", "Timesheets": "visible", "Automations": "visible", "Work Orders": "visible"}	visibility	Controls whether modules are visible, hidden, or internal-only during walkthroughs.	f	\N	2026-05-13 01:26:29.037606+00	2026-05-13 01:26:29.037606+00
3	automation_mode	"disabled"	system	Global automation mode used by internal workflow hooks (disabled/test/live).	f	\N	2026-05-13 01:26:29.068367+00	2026-05-13 01:26:29.068367+00
4	maintenance_banner	{"enabled": false, "message": ""}	ui	Optional maintenance banner shown in the workspace.	f	\N	2026-05-13 01:26:29.099046+00	2026-05-13 01:26:29.099046+00
5	app_display_labels	{"workspaceName": "Diversified OS"}	ui	Display labels that are safe to edit from the UI.	f	\N	2026-05-13 01:26:29.129791+00	2026-05-13 01:26:29.129791+00
6	demo_visibility_flags	{"hideIncompletePages": true}	visibility	Safety switches for client walkthrough visibility behavior.	f	\N	2026-05-13 01:26:29.16053+00	2026-05-13 01:26:29.16053+00
1	notification_preferences	{"task_overdue": {"sms": false, "email": true, "inApp": true}, "low_inventory": {"sms": false, "email": true, "inApp": true}, "task_assigned": {"sms": false, "email": true, "inApp": true}, "form_submitted": {"sms": false, "email": true, "inApp": true}, "request_submitted": {"sms": false, "email": true, "inApp": true}, "timesheet_submitted": {"sms": false, "email": true, "inApp": true}, "work_order_assigned": {"sms": false, "email": true, "inApp": true}, "weekly_leadership_summary": {"sms": false, "email": true, "inApp": true}, "request_approved_or_denied": {"sms": false, "email": true, "inApp": true}}	notifications	Internal notification channel preferences for operations events.	f	\N	2026-05-14 08:52:11.840393+00	2026-05-13 01:26:29.005553+00
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.tasks (id, title, description, status, priority, assigned_to, due_date, completed_at, created_at, division, topic, notes, start_date, start_time, end_time, all_day, repeat_schedule, estimated_hours, estimated_minutes, is_private, locked) FROM stdin;
14	Review open work orders	Weekly review of all open and blocked WOs	completed	low	1	2026-05-09	\N	2026-05-09 14:14:47.291129+00	Diversified	\N	\N	2026-05-09	09:00	10:00	f	None	0	0	f	f
10	Submit May timesheets	All field staff to submit by EOD Friday	todo	high	1	2026-05-10	\N	2026-05-09 14:14:47.291129+00	Diversified	\N	\N	2026-05-10	09:00	10:00	f	None	0	0	f	t
15	Process PTO requests	Three pending requests need HR review	in_progress	high	6	2026-05-11	\N	2026-05-09 14:14:47.291129+00	Diversified	\N	\N	2026-05-12	11:00	12:00	f	None	0	0	f	f
9	Complete Q2 inventory audit	Full count of warehouse sections A through D	in_progress	high	3	2026-05-15	\N	2026-05-09 14:14:47.291129+00	Diversified	\N	\N	2026-05-15	09:00	10:00	f	None	0	0	f	f
11	Update SOP-004 safety protocols	Incorporate new OSHA guidelines from April memo	todo	medium	1	2026-05-20	\N	2026-05-09 14:14:47.291129+00	Diversified	\N	\N	2026-05-20	09:00	10:00	f	None	0	0	f	f
13	Schedule team training session	New equipment orientation for field techs	in_progress	medium	5	2026-05-22	\N	2026-05-09 14:14:47.291129+00	Diversified	\N	\N	2026-05-22	09:00	10:00	f	None	0	0	f	f
16	Fix bay door 3 hydraulics	Reported sticking — maintenance needed	blocked	high	2	2026-05-10	\N	2026-05-09 14:14:47.291129+00	Diversified	\N	\N	2026-05-10	09:00	10:00	f	None	0	0	f	f
17	Q2 Financial Review Preparation	Compile and review Q2 financial statements for leadership meeting	in_progress	high	7	2026-05-20	\N	2026-05-10 04:11:52.290788+00	Diversified	\N	\N	2026-05-20	09:00	10:00	f	None	0	0	f	f
18	Vendor Contract Renewals	Review and renew expiring vendor contracts for Q3	todo	medium	8	2026-06-01	\N	2026-05-10 04:11:52.290788+00	Diversified	\N	\N	2026-06-01	09:00	10:00	f	None	0	0	f	f
19	Office Supply Inventory Audit	Conduct full audit of office supplies and restock essentials	in_progress	medium	9	2026-05-15	\N	2026-05-10 04:11:52.290788+00	Diversified	\N	\N	2026-05-15	09:00	10:00	f	None	0	0	f	f
20	Employee Handbook Update	Update employee handbook with new remote work policies	todo	high	10	2026-05-25	\N	2026-05-10 04:11:52.290788+00	Diversified	\N	\N	2026-05-25	09:00	10:00	f	None	0	0	f	f
22	New Hire Onboarding Plan	Design updated onboarding program for summer hires	in_progress	medium	10	2026-05-22	\N	2026-05-10 04:11:52.290788+00	Diversified	\N	\N	2026-05-22	09:00	10:00	f	None	0	0	f	f
1	QA Seed Task	Seeded for API smoke checks	in_progress	high	1	2026-05-17	\N	2026-05-10 11:24:53.223353+00	Diversified	\N	\N	2026-05-17	09:00	10:00	f	None	0	0	f	f
24	WI Marketing Meeting	Weekly Wisconsin territory check-in	todo	medium	2	2026-05-10	\N	2026-05-10 20:29:01.793999+00	Sales	Sales	\N	2026-05-10	13:00	14:00	f	None	1	0	f	f
23	AZ Marketing Rev M1133	Monthly marketing review meeting	completed	high	1	2026-05-10	\N	2026-05-10 20:29:01.793999+00	Marketing	Marketing	\N	2026-05-10	12:30	13:30	f	None	1	0	f	f
12	Reorder janitorial supplies	Stock below threshold — reorder from preferred vendor	todo	medium	3	2026-05-12	\N	2026-05-09 14:14:47.291129+00	Diversified	\N	\N	2026-05-12	09:00	10:00	f	None	0	0	f	f
28	SB Q Review	Q2 SB quarterly review preparation	in_progress	high	1	2026-05-12	\N	2026-05-10 20:29:01.793999+00	Finance	Reporting	\N	2026-05-12	11:00	12:30	f	None	1	30	f	f
25	Spencer 2PM	Spencer client follow-up call	todo	medium	3	2026-05-11	\N	2026-05-10 20:29:01.793999+00	Operations	Client	\N	2026-05-11	11:00	12:00	f	None	1	0	f	f
26	PNT Reorder	Paint supply reorder approval needed	completed	high	1	2026-05-11	\N	2026-05-10 20:29:01.793999+00	Purchasing	Supplies	\N	2026-05-12	16:00	16:30	f	None	0	30	f	f
27	EOS Ad Options	Review advertising options for EOS campaign	todo	medium	4	2026-05-12	\N	2026-05-10 20:29:01.793999+00	Marketing	Advertising	\N	2026-05-11	15:00	16:00	f	None	1	0	f	f
21	Fleet Maintenance Schedule	Create preventive maintenance schedule for all company vehicles	todo	medium	8	2026-05-18	\N	2026-05-10 04:11:52.290788+00	Diversified	\N	\N	2026-05-19	09:00	10:00	f	None	0	0	f	t
32	Shirts V23 Vince + Al	Uniform order confirmation Vince and Al	todo	low	5	2026-05-14	\N	2026-05-10 20:29:01.793999+00	Operations	Admin	\N	2026-05-14	15:00	15:30	f	None	0	30	f	f
30	Maint M 1-1:30A	Morning maintenance meeting bay 1-3	todo	medium	3	2026-05-13	\N	2026-05-10 20:29:01.793999+00	Maintenance	Facilities	\N	2026-05-14	10:00	11:00	f	None	1	0	f	f
31	Rev Profit BK Even	Revenue and break-even profitability review	completed	high	1	2026-05-14	\N	2026-05-10 20:29:01.793999+00	Finance	Reporting	\N	2026-05-16	08:00	09:00	f	None	1	0	f	f
35	S.O.P. needed for the new hires.	\N	todo	medium	10	2026-05-14	\N	2026-05-12 18:30:08.162219+00	Diversified	\N	\N	2026-05-11	12:00	13:00	f	None	0	0	f	f
29	New FX Lawyers	Legal consultation re: FX contract terms	todo	urgent	2	2026-05-13	\N	2026-05-10 20:29:01.793999+00	Legal	Legal	\N	2026-05-12	13:00	14:30	f	None	1	30	f	f
\.


--
-- Data for Name: timeclock_entries; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.timeclock_entries (id, employee_id, employee_name, clock_in, clock_out, notes, created_at) FROM stdin;
1	1	Terry Strasser	2026-05-08 08:00:00+00	2026-05-08 17:00:00+00	Friday regular shift	2026-05-10 05:03:43.302656+00
2	2	Jordan Strasser	2026-05-08 08:30:00+00	2026-05-08 17:15:00+00	Friday with lunch break	2026-05-10 05:03:43.302656+00
3	3	Cathy Kraft	2026-05-07 09:00:00+00	2026-05-07 17:30:00+00	Thursday regular shift	2026-05-10 05:03:43.302656+00
4	4	Jill Strasser	2026-05-07 08:00:00+00	2026-05-07 16:45:00+00	Thursday early departure	2026-05-10 05:03:43.302656+00
5	1	Terry Strasser	2026-05-09 07:30:00+00	\N	Currently clocked in	2026-05-10 05:03:43.302656+00
6	2	Jordan Strasser	2026-05-09 08:00:00+00	\N	Currently clocked in	2026-05-10 05:03:43.302656+00
7	3	Cathy Kraft	2026-05-09 08:15:00+00	2026-05-09 12:30:00+00	Half day	2026-05-10 05:03:43.302656+00
8	4	Jill Strasser	2026-05-06 08:00:00+00	2026-05-06 17:00:00+00	Monday regular shift	2026-05-10 05:03:43.302656+00
9	\N	Test Employee	2026-05-10 05:05:40.54071+00	\N	\N	2026-05-10 05:05:40.54071+00
10	\N	QA Clockout Fix 1778389765	2026-05-10 05:09:25.710274+00	\N	\N	2026-05-10 05:09:25.710274+00
11	\N	QA Clockout Fix 1778389793	2026-05-10 05:09:54.150591+00	2026-05-10 05:09:54.18217+00	\N	2026-05-10 05:09:54.150591+00
12	\N	Terry Strasser	2026-05-10 07:03:17.790123+00	2026-05-10 07:03:19.353436+00	\N	2026-05-10 07:03:17.790123+00
13	7	Terry Strasser	2026-05-02 07:55:00+00	2026-05-02 16:50:00+00	Seed Timeclock: Crew staging and morning dispatch	2026-05-10 07:03:43.750766+00
14	8	Jordan Strasser	2026-05-04 08:20:00+00	2026-05-04 17:10:00+00	Seed Timeclock: Jobsite coordination and vendor calls	2026-05-10 07:03:43.750766+00
15	9	Cathy Kraft	2026-05-05 07:45:00+00	\N	Seed Timeclock: Active shift in progress	2026-05-10 07:03:43.750766+00
16	10	Jill Strasser	2026-05-05 08:10:00+00	2026-05-05 16:40:00+00	Seed Timeclock: Front office support and payroll prep	2026-05-10 07:03:43.750766+00
17	1	Marcus Rivera	2026-05-06 08:00:00+00	2026-05-06 17:05:00+00	Seed Timeclock: Inventory reconciliation and deliveries	2026-05-10 07:03:43.750766+00
18	2	Destiny Johnson	2026-05-07 08:05:00+00	\N	Seed Timeclock: Active shift in progress	2026-05-10 07:03:43.750766+00
19	3	Carlos Mendez	2026-05-07 07:50:00+00	2026-05-07 16:35:00+00	Seed Timeclock: Work order closeout documentation	2026-05-10 07:03:43.750766+00
20	4	Aisha Thompson	2026-05-08 08:15:00+00	\N	Seed Timeclock: Active shift in progress	2026-05-10 07:03:43.750766+00
21	\N	Terry Strasser	2026-05-10 23:18:19.616714+00	2026-05-10 23:18:26.004201+00	\N	2026-05-10 23:18:19.616714+00
22	\N	Cathy Kraft	2026-05-12 18:30:48.107541+00	\N	\N	2026-05-12 18:30:48.107541+00
23	12	ZITADEL Admin	2026-05-14 09:51:59.907347+00	\N	\N	2026-05-14 09:51:59.907347+00
24	5	Jordan Lee	2026-05-14 09:52:07.55831+00	\N	\N	2026-05-14 09:52:07.55831+00
\.


--
-- Data for Name: timesheets; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.timesheets (id, employee_id, employee_name, week_start, week_end, monday_hours, tuesday_hours, wednesday_hours, thursday_hours, friday_hours, saturday_hours, sunday_hours, status, submitted_at, approved_by, notes, created_at) FROM stdin;
1	1	Terry Strasser	2026-05-04	2026-05-10	8.00	8.00	8.00	8.00	8.00	0.00	0.00	approved	\N	Admin	Regular work week	2026-05-10 05:03:43.30436+00
2	2	Jordan Strasser	2026-05-04	2026-05-10	8.50	8.25	8.00	8.00	8.25	0.00	0.00	approved	\N	Admin	Regular work week	2026-05-10 05:03:43.30436+00
3	3	Cathy Kraft	2026-05-04	2026-05-10	8.00	8.00	8.00	8.50	4.00	0.00	0.00	submitted	2026-05-09 17:30:00+00	\N	Friday half day - conference call	2026-05-10 05:03:43.30436+00
4	4	Jill Strasser	2026-05-04	2026-05-10	8.00	7.75	8.00	8.00	8.00	0.00	0.00	submitted	2026-05-09 16:00:00+00	\N	Regular work week	2026-05-10 05:03:43.30436+00
5	1	Terry Strasser	2026-04-27	2026-05-03	8.00	8.00	8.00	8.00	8.00	0.00	0.00	draft	\N	\N	Previous week - draft	2026-05-10 05:03:43.30436+00
6	7	Terry Strasser	2026-05-04	2026-05-10	8.00	8.00	8.00	8.00	8.00	0.00	0.00	approved	\N	Payroll Admin	Seed Timesheet: Leadership operations week	2026-05-10 07:03:43.759964+00
7	8	Jordan Strasser	2026-05-04	2026-05-10	8.50	8.25	8.00	8.00	8.25	0.00	0.00	approved	\N	Payroll Admin	Seed Timesheet: Field operations and dispatch support	2026-05-10 07:03:43.759964+00
8	9	Cathy Kraft	2026-05-04	2026-05-10	8.00	8.00	8.00	8.50	4.00	0.00	0.00	submitted	2026-05-10 07:03:43.759964+00	\N	Seed Timesheet: Submitted pending payroll review	2026-05-10 07:03:43.759964+00
9	10	Jill Strasser	2026-05-04	2026-05-10	7.75	8.00	8.00	8.00	8.00	0.00	0.00	submitted	2026-05-10 07:03:43.759964+00	\N	Seed Timesheet: Submitted pending manager approval	2026-05-10 07:03:43.759964+00
10	1	Marcus Rivera	2026-05-04	2026-05-10	8.00	8.00	8.00	8.00	0.00	0.00	0.00	draft	\N	\N	Seed Timesheet: Draft awaiting final hours	2026-05-10 07:03:43.759964+00
11	7	Terry Strasser	2026-05-11	2026-05-17	8.00	8.00	8.00	8.00	8.00	0.00	0.00	approved	\N	Payroll Admin	Seed Timesheet: Leadership operations week	2026-05-14 00:08:35.510753+00
12	8	Jordan Strasser	2026-05-11	2026-05-17	8.50	8.25	8.00	8.00	8.25	0.00	0.00	approved	\N	Payroll Admin	Seed Timesheet: Field operations and dispatch support	2026-05-14 00:08:35.510753+00
13	9	Cathy Kraft	2026-05-11	2026-05-17	8.00	8.00	8.00	8.50	4.00	0.00	0.00	submitted	2026-05-14 00:08:35.510753+00	\N	Seed Timesheet: Submitted pending payroll review	2026-05-14 00:08:35.510753+00
14	10	Jill Strasser	2026-05-11	2026-05-17	7.75	8.00	8.00	8.00	8.00	0.00	0.00	submitted	2026-05-14 00:08:35.510753+00	\N	Seed Timesheet: Submitted pending manager approval	2026-05-14 00:08:35.510753+00
15	1	Marcus Rivera	2026-05-11	2026-05-17	8.00	8.00	8.00	8.00	0.00	0.00	0.00	draft	\N	\N	Seed Timesheet: Draft awaiting final hours	2026-05-14 00:08:35.510753+00
\.


--
-- Data for Name: work_orders; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.work_orders (id, title, description, type, status, priority, owner, due_date, completed_at, created_at, division, notes, updated_at, created_by, updated_by) FROM stdin;
8	HVAC Filter Replacement — Main Office	Quarterly filter swap, all units	Maintenance	open	medium	5	2026-05-18	\N	2026-05-09 14:14:47.292427+00	Operations	\N	2026-05-14 00:08:34.893356+00	\N	\N
10	Install Security Camera — Dock B	New camera mount and wiring run	Installation	open	medium	5	2026-05-25	\N	2026-05-09 14:14:47.292427+00	Operations	\N	2026-05-14 00:08:34.893356+00	\N	\N
11	Repaint Warehouse Aisle Markings	Safety lines faded in sections B and C	Facilities	waiting	low	3	2026-06-01	\N	2026-05-09 14:14:47.292427+00	Operations	\N	2026-05-14 00:08:34.893356+00	\N	\N
13	Executive Office Renovation	Coordinate renovation of executive office suite including flooring and paint	Facility	in_progress	high	7	2026-06-10	\N	2026-05-10 04:11:52.292069+00	Operations	\N	2026-05-14 00:08:34.893356+00	\N	\N
14	Warehouse Safety Inspection	Complete OSHA-compliant safety inspection of main warehouse	Safety	open	high	8	2026-05-28	\N	2026-05-10 04:11:52.292069+00	Operations	\N	2026-05-14 00:08:34.893356+00	\N	\N
15	Admin Wing HVAC Repair	Repair HVAC system in administrative wing - temperature fluctuations reported	Maintenance	open	medium	9	2026-05-20	\N	2026-05-10 04:11:52.292069+00	Operations	\N	2026-05-14 00:08:34.893356+00	\N	\N
16	HR Document Digitization	Scan and digitize all historical HR records into document management system	Administrative	open	medium	10	2026-06-15	\N	2026-05-10 04:11:52.292069+00	Operations	\N	2026-05-14 00:08:34.893356+00	\N	\N
1	QA Seed Work Order	Seeded for API smoke checks	maintenance	open	high	1	2026-05-17	\N	2026-05-10 11:24:53.223353+00	Operations	\N	2026-05-14 00:08:34.893356+00	\N	\N
\.


--
-- Data for Name: workspace; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.workspace (id, title, description, meta, fk_user_id, deleted, deleted_at, "order", status, message, plan, infra_meta, fk_org_id, stripe_customer_id, grace_period_start_at, api_grace_period_start_at, automation_grace_period_start_at, loyal, loyalty_discount_used, db_job_id, fk_db_instance_id, segment_code, created_at, updated_at) FROM stdin;
wdit5tu4	Default Workspace	\N	\N	us01zuvdfry4xe7g	f	\N	\N	1	\N	free	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	2026-05-09 10:51:38+00	2026-05-09 10:51:38+00
\.


--
-- Data for Name: workspace_user; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.workspace_user (fk_workspace_id, fk_user_id, roles, invite_token, invite_accepted, deleted, deleted_at, "order", invited_by, created_at, updated_at, scim_external_id, scim_managed, scim_user_name, scim_meta) FROM stdin;
wdit5tu4	us01zuvdfry4xe7g	workspace-level-owner	\N	f	f	\N	1	\N	2026-05-09 10:51:38+00	2026-05-09 10:51:38+00	\N	f	\N	\N
\.


--
-- Data for Name: xc_knex_migrationsv0; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.xc_knex_migrationsv0 (id, name, batch, migration_time) FROM stdin;
1	nc_001_init	1	2026-05-09 07:13:19.095+00
2	nc_002_teams	1	2026-05-09 07:13:19.121+00
3	nc_003_alter_row_color_condition_nc_order_col	1	2026-05-09 07:13:19.131+00
4	nc_004_workflows	1	2026-05-09 07:13:19.165+00
5	nc_005_add_user_specific_and_meta_column_in_sync_configs	1	2026-05-09 07:13:19.167+00
6	nc_006_dependency_slots	1	2026-05-09 07:13:19.178+00
7	nc_007_workflow_draft	1	2026-05-09 07:13:19.181+00
8	nc_008_license_server	1	2026-05-09 07:13:19.192+00
9	nc_009_dependency_tracker_timestamp	1	2026-05-09 07:13:19.197+00
10	nc_010_add_constraints_col_in_column_table	1	2026-05-09 07:13:19.199+00
11	nc_011_merge_workflows_scripts	1	2026-05-09 07:13:19.228+00
12	nc_012_workflow_delay	1	2026-05-09 07:13:19.234+00
13	nc_013_composite_pk_missing_tables	1	2026-05-09 07:13:19.266+00
14	nc_014_sandboxes	1	2026-05-09 07:13:19.366+00
15	nc_015_managed_apps	1	2026-05-09 07:13:19.41+00
16	nc_016_automation_error_notifications	1	2026-05-09 07:13:19.43+00
17	nc_017_add_canonical_email_to_users	1	2026-05-09 07:13:19.436+00
18	nc_018_add_enabled_to_filter_exp_v2	1	2026-05-09 07:13:19.45+00
19	nc_019_sandboxes	1	2026-05-09 07:13:19.483+00
20	nc_020_add_cell_coloring_fields_to_row_color_conditions	1	2026-05-09 07:13:19.486+00
21	nc_021_scim_support	1	2026-05-09 07:13:19.517+00
22	nc_022_record_templates	1	2026-05-09 07:13:19.537+00
23	nc_023_rls_policies	1	2026-05-09 07:13:19.568+00
24	nc_202601010000_placeholder	1	2026-05-09 07:13:19.569+00
25	nc_202602250000_outline_view	1	2026-05-09 07:13:19.616+00
26	nc_202602250001_button_filter	1	2026-05-09 07:13:19.628+00
27	nc_202602260000_rename_outline_to_list_view	1	2026-05-09 07:13:19.636+00
28	nc_202602260636_view_sections	1	2026-05-09 07:13:19.656+00
29	nc_202602251401_links_v2	1	2026-05-09 07:13:19.658+00
30	nc_202602270448_map_view_columns_add_source_id	1	2026-05-09 07:13:19.667+00
31	nc_202602270729_timeline_view	1	2026-05-09 07:13:19.703+00
32	nc_202602260000_unify_ce_roles	1	2026-05-09 07:13:19.707+00
33	nc_202603020000_hook_error_notifications	1	2026-05-09 07:13:19.713+00
34	nc_202603020001_teams_hierarchy	1	2026-05-09 07:13:19.72+00
35	nc_202603020002_chat	1	2026-05-09 07:13:19.739+00
36	nc_202603060621_form_page_breaks	1	2026-05-09 07:13:19.74+00
37	nc_202603050000_docs	1	2026-05-09 07:13:19.775+00
38	nc_202603050001_file_ref_doc_idx	1	2026-05-09 07:13:19.779+00
39	nc_202603090001_chat_session_meta	1	2026-05-09 07:13:19.78+00
40	nc_202603110001_chat_session_base_id	1	2026-05-09 07:13:19.788+00
41	nc_202603170000_form_view_expires_at	1	2026-05-09 07:13:19.789+00
42	nc_202603170001_workflow_draft_reminder	1	2026-05-09 07:13:19.792+00
43	nc_202603090002_date_dependency	1	2026-05-09 07:13:19.803+00
44	nc_202603230000_subscription_last_paid_seat_count	1	2026-05-09 07:13:19.806+00
45	nc_202603301109_fine_grained_api_tokens	1	2026-05-09 07:13:19.826+00
46	nc_202603310000_integration_links	1	2026-05-09 07:13:19.84+00
47	nc_202604030000_installations_add_fk_user_id	1	2026-05-09 07:13:19.845+00
48	nc_202604040000_gcp_marketplace	1	2026-05-09 07:13:19.876+00
49	nc_202604071200_default_org	1	2026-05-09 07:13:19.909+00
50	nc_202604071201_scim_config_default_role	1	2026-05-09 07:13:19.943+00
51	nc_202604100000_audit_org_id	1	2026-05-09 07:13:19.953+00
52	nc_202604160000_docs_in_data	1	2026-05-09 07:13:19.965+00
53	nc_202604200002_trash_cleanup_due_at	1	2026-05-09 07:13:19.971+00
54	nc_202603180000_user_mfa	1	2026-05-09 07:13:19.973+00
55	nc_202604220000_uuid_readonly	1	2026-05-09 07:13:19.974+00
56	nc_202604270000_base_trash	1	2026-05-09 07:13:20.046+00
57	nc_202604290000_base_variables_and_sandbox_changelog	1	2026-05-09 07:13:20.098+00
58	nc_202605040000_form_view_columns_row_id	1	2026-05-09 07:13:20.108+00
59	nc_202605050000_ltar_display_value_column	1	2026-05-09 07:13:20.114+00
\.


--
-- Data for Name: xc_knex_migrationsv0_lock; Type: TABLE DATA; Schema: public; Owner: diversified
--

COPY public.xc_knex_migrationsv0_lock (index, is_locked) FROM stdin;
1	0
\.


--
-- Name: Features_id_seq; Type: SEQUENCE SET; Schema: pdino8tpcml3eup; Owner: diversified
--

SELECT pg_catalog.setval('pdino8tpcml3eup."Features_id_seq"', 1, false);


--
-- Name: document_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.document_audit_logs_id_seq', 1, false);


--
-- Name: document_signatures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.document_signatures_id_seq', 1, false);


--
-- Name: document_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.document_versions_id_seq', 1, false);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.documents_id_seq', 1, false);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.employees_id_seq', 13, true);


--
-- Name: file_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.file_records_id_seq', 10, true);


--
-- Name: forms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.forms_id_seq', 1, false);


--
-- Name: inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.inventory_id_seq', 10, true);


--
-- Name: nc_api_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.nc_api_tokens_id_seq', 1, false);


--
-- Name: nc_store_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.nc_store_id_seq', 4, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.requests_id_seq', 11, true);


--
-- Name: sop_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.sop_steps_id_seq', 14, true);


--
-- Name: sops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.sops_id_seq', 12, true);


--
-- Name: system_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.system_audit_logs_id_seq', 1, true);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 115, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.tasks_id_seq', 35, true);


--
-- Name: timeclock_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.timeclock_entries_id_seq', 24, true);


--
-- Name: timesheets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.timesheets_id_seq', 15, true);


--
-- Name: work_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.work_orders_id_seq', 16, true);


--
-- Name: xc_knex_migrationsv0_id_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.xc_knex_migrationsv0_id_seq', 59, true);


--
-- Name: xc_knex_migrationsv0_lock_index_seq; Type: SEQUENCE SET; Schema: public; Owner: diversified
--

SELECT pg_catalog.setval('public.xc_knex_migrationsv0_lock_index_seq', 1, true);


--
-- Name: Features Features_pkey; Type: CONSTRAINT; Schema: pdino8tpcml3eup; Owner: diversified
--

ALTER TABLE ONLY pdino8tpcml3eup."Features"
    ADD CONSTRAINT "Features_pkey" PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: automation_events automation_events_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.automation_events
    ADD CONSTRAINT automation_events_pkey PRIMARY KEY (id);


--
-- Name: calendar_blocks calendar_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.calendar_blocks
    ADD CONSTRAINT calendar_blocks_pkey PRIMARY KEY (id);


--
-- Name: calendar_sync_logs calendar_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.calendar_sync_logs
    ADD CONSTRAINT calendar_sync_logs_pkey PRIMARY KEY (id);


--
-- Name: document_audit_logs document_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.document_audit_logs
    ADD CONSTRAINT document_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: document_signatures document_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.document_signatures
    ADD CONSTRAINT document_signatures_pkey PRIMARY KEY (id);


--
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: file_records file_records_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.file_records
    ADD CONSTRAINT file_records_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: forms forms_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.forms
    ADD CONSTRAINT forms_pkey PRIMARY KEY (id);


--
-- Name: nc_api_token_scopes idx_api_token_scopes_unique; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_api_token_scopes
    ADD CONSTRAINT idx_api_token_scopes_unique UNIQUE (fk_api_token_id, resource_type, resource_id);


--
-- Name: nc_api_tokens idx_api_tokens_hash; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_api_tokens
    ADD CONSTRAINT idx_api_tokens_hash UNIQUE (token_hash);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: microsoft_connections microsoft_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.microsoft_connections
    ADD CONSTRAINT microsoft_connections_pkey PRIMARY KEY (id);


--
-- Name: nc_api_token_scopes nc_api_token_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_api_token_scopes
    ADD CONSTRAINT nc_api_token_scopes_pkey PRIMARY KEY (id);


--
-- Name: nc_api_tokens nc_api_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_api_tokens
    ADD CONSTRAINT nc_api_tokens_pkey PRIMARY KEY (id);


--
-- Name: nc_audit_v2 nc_audit_v2_pkx; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_audit_v2
    ADD CONSTRAINT nc_audit_v2_pkx PRIMARY KEY (id);


--
-- Name: nc_automation_executions nc_automation_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_automation_executions
    ADD CONSTRAINT nc_automation_executions_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_automation_subscribers nc_automation_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_automation_subscribers
    ADD CONSTRAINT nc_automation_subscribers_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_automation_subscribers nc_automation_subscribers_unique_idx; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_automation_subscribers
    ADD CONSTRAINT nc_automation_subscribers_unique_idx UNIQUE (base_id, fk_automation_id, fk_user_id);


--
-- Name: nc_automations nc_automations_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_automations
    ADD CONSTRAINT nc_automations_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_base_users_v2 nc_base_users_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_base_users_v2
    ADD CONSTRAINT nc_base_users_v2_pkey PRIMARY KEY (base_id, fk_user_id);


--
-- Name: nc_base_variables nc_base_variables_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_base_variables
    ADD CONSTRAINT nc_base_variables_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_base_variables nc_base_variables_ws_base_key_unique; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_base_variables
    ADD CONSTRAINT nc_base_variables_ws_base_key_unique UNIQUE (fk_workspace_id, base_id, key);


--
-- Name: nc_sources_v2 nc_bases_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_sources_v2
    ADD CONSTRAINT nc_bases_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_calendar_view_columns_v2 nc_calendar_view_columns_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_calendar_view_columns_v2
    ADD CONSTRAINT nc_calendar_view_columns_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_calendar_view_range_v2 nc_calendar_view_range_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_calendar_view_range_v2
    ADD CONSTRAINT nc_calendar_view_range_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_calendar_view_v2 nc_calendar_view_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_calendar_view_v2
    ADD CONSTRAINT nc_calendar_view_v2_pkey PRIMARY KEY (base_id, fk_view_id);


--
-- Name: nc_chat_messages nc_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_chat_messages
    ADD CONSTRAINT nc_chat_messages_pkey PRIMARY KEY (fk_workspace_id, id);


--
-- Name: nc_chat_sessions nc_chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_chat_sessions
    ADD CONSTRAINT nc_chat_sessions_pkey PRIMARY KEY (fk_workspace_id, id);


--
-- Name: nc_col_barcode_v2 nc_col_barcode_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_col_barcode_v2
    ADD CONSTRAINT nc_col_barcode_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_col_button_v2 nc_col_button_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_col_button_v2
    ADD CONSTRAINT nc_col_button_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_col_formula_v2 nc_col_formula_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_col_formula_v2
    ADD CONSTRAINT nc_col_formula_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_col_long_text_v2 nc_col_long_text_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_col_long_text_v2
    ADD CONSTRAINT nc_col_long_text_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_col_lookup_v2 nc_col_lookup_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_col_lookup_v2
    ADD CONSTRAINT nc_col_lookup_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_col_qrcode_v2 nc_col_qrcode_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_col_qrcode_v2
    ADD CONSTRAINT nc_col_qrcode_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_col_relations_v2 nc_col_relations_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_col_relations_v2
    ADD CONSTRAINT nc_col_relations_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_col_rollup_v2 nc_col_rollup_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_col_rollup_v2
    ADD CONSTRAINT nc_col_rollup_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_col_select_options_v2 nc_col_select_options_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_col_select_options_v2
    ADD CONSTRAINT nc_col_select_options_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_columns_v2 nc_columns_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_columns_v2
    ADD CONSTRAINT nc_columns_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_comment_reactions nc_comment_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_comment_reactions
    ADD CONSTRAINT nc_comment_reactions_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_comments nc_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_comments
    ADD CONSTRAINT nc_comments_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_custom_urls_v2 nc_custom_urls_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_custom_urls_v2
    ADD CONSTRAINT nc_custom_urls_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_dashboards_v2 nc_dashboards_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_dashboards_v2
    ADD CONSTRAINT nc_dashboards_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_data_reflection nc_data_reflection_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_data_reflection
    ADD CONSTRAINT nc_data_reflection_pkey PRIMARY KEY (id);


--
-- Name: nc_date_dependency_v2 nc_date_dependency_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_date_dependency_v2
    ADD CONSTRAINT nc_date_dependency_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_db_servers nc_db_servers_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_db_servers
    ADD CONSTRAINT nc_db_servers_pkey PRIMARY KEY (id);


--
-- Name: nc_dependency_tracker nc_dependency_tracker_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_dependency_tracker
    ADD CONSTRAINT nc_dependency_tracker_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_disabled_models_for_role_v2 nc_disabled_models_for_role_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_disabled_models_for_role_v2
    ADD CONSTRAINT nc_disabled_models_for_role_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_doc_content_v2 nc_doc_content_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_doc_content_v2
    ADD CONSTRAINT nc_doc_content_v2_pkey PRIMARY KEY (base_id, fk_doc_id);


--
-- Name: nc_docs_v2 nc_docs_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_docs_v2
    ADD CONSTRAINT nc_docs_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_extensions nc_extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_extensions
    ADD CONSTRAINT nc_extensions_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_file_references nc_file_references_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_file_references
    ADD CONSTRAINT nc_file_references_pkey PRIMARY KEY (id);


--
-- Name: nc_filter_exp_v2 nc_filter_exp_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_filter_exp_v2
    ADD CONSTRAINT nc_filter_exp_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_follower nc_follower_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_follower
    ADD CONSTRAINT nc_follower_pkey PRIMARY KEY (fk_user_id, fk_follower_id);


--
-- Name: nc_form_view_columns_v2 nc_form_view_columns_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_form_view_columns_v2
    ADD CONSTRAINT nc_form_view_columns_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_form_view_v2 nc_form_view_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_form_view_v2
    ADD CONSTRAINT nc_form_view_v2_pkey PRIMARY KEY (base_id, fk_view_id);


--
-- Name: nc_gallery_view_columns_v2 nc_gallery_view_columns_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_gallery_view_columns_v2
    ADD CONSTRAINT nc_gallery_view_columns_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_gallery_view_v2 nc_gallery_view_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_gallery_view_v2
    ADD CONSTRAINT nc_gallery_view_v2_pkey PRIMARY KEY (base_id, fk_view_id);


--
-- Name: nc_gcp_marketplace_accounts nc_gcp_marketplace_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_gcp_marketplace_accounts
    ADD CONSTRAINT nc_gcp_marketplace_accounts_pkey PRIMARY KEY (id);


--
-- Name: nc_gcp_marketplace_accounts nc_gcp_marketplace_accounts_procurement_account_id_unique; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_gcp_marketplace_accounts
    ADD CONSTRAINT nc_gcp_marketplace_accounts_procurement_account_id_unique UNIQUE (procurement_account_id);


--
-- Name: nc_gcp_marketplace_entitlements nc_gcp_marketplace_entitlements_entitlement_id_unique; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_gcp_marketplace_entitlements
    ADD CONSTRAINT nc_gcp_marketplace_entitlements_entitlement_id_unique UNIQUE (entitlement_id);


--
-- Name: nc_gcp_marketplace_entitlements nc_gcp_marketplace_entitlements_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_gcp_marketplace_entitlements
    ADD CONSTRAINT nc_gcp_marketplace_entitlements_pkey PRIMARY KEY (id);


--
-- Name: nc_grid_view_columns_v2 nc_grid_view_columns_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_grid_view_columns_v2
    ADD CONSTRAINT nc_grid_view_columns_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_grid_view_v2 nc_grid_view_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_grid_view_v2
    ADD CONSTRAINT nc_grid_view_v2_pkey PRIMARY KEY (base_id, fk_view_id);


--
-- Name: nc_hook_logs_v2 nc_hook_logs_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_hook_logs_v2
    ADD CONSTRAINT nc_hook_logs_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_hook_trigger_fields nc_hook_trigger_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_hook_trigger_fields
    ADD CONSTRAINT nc_hook_trigger_fields_pkey PRIMARY KEY (fk_workspace_id, base_id, fk_hook_id, fk_column_id);


--
-- Name: nc_hooks_v2 nc_hooks_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_hooks_v2
    ADD CONSTRAINT nc_hooks_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_installations nc_installations_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_installations
    ADD CONSTRAINT nc_installations_pkey PRIMARY KEY (id);


--
-- Name: nc_integration_links_v2 nc_integration_links_v2_fk_integration_id_base_id_unique; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_integration_links_v2
    ADD CONSTRAINT nc_integration_links_v2_fk_integration_id_base_id_unique UNIQUE (fk_integration_id, base_id);


--
-- Name: nc_integration_links_v2 nc_integration_links_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_integration_links_v2
    ADD CONSTRAINT nc_integration_links_v2_pkey PRIMARY KEY (id);


--
-- Name: nc_integrations_store_v2 nc_integrations_store_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_integrations_store_v2
    ADD CONSTRAINT nc_integrations_store_v2_pkey PRIMARY KEY (id);


--
-- Name: nc_integrations_v2 nc_integrations_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_integrations_v2
    ADD CONSTRAINT nc_integrations_v2_pkey PRIMARY KEY (id);


--
-- Name: nc_jobs nc_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_jobs
    ADD CONSTRAINT nc_jobs_pkey PRIMARY KEY (id);


--
-- Name: nc_kanban_view_columns_v2 nc_kanban_view_columns_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_kanban_view_columns_v2
    ADD CONSTRAINT nc_kanban_view_columns_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_kanban_view_v2 nc_kanban_view_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_kanban_view_v2
    ADD CONSTRAINT nc_kanban_view_v2_pkey PRIMARY KEY (base_id, fk_view_id);


--
-- Name: nc_managed_app_versions nc_managed_app_versions_number_unique_idx; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_managed_app_versions
    ADD CONSTRAINT nc_managed_app_versions_number_unique_idx UNIQUE (fk_managed_app_id, version_number);


--
-- Name: nc_managed_app_versions nc_managed_app_versions_unique_idx; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_managed_app_versions
    ADD CONSTRAINT nc_managed_app_versions_unique_idx UNIQUE (fk_managed_app_id, version);


--
-- Name: nc_map_view_columns_v2 nc_map_view_columns_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_map_view_columns_v2
    ADD CONSTRAINT nc_map_view_columns_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_map_view_v2 nc_map_view_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_map_view_v2
    ADD CONSTRAINT nc_map_view_v2_pkey PRIMARY KEY (base_id, fk_view_id);


--
-- Name: nc_mcp_tokens nc_mcp_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_mcp_tokens
    ADD CONSTRAINT nc_mcp_tokens_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_model_stats_v2 nc_model_stats_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_model_stats_v2
    ADD CONSTRAINT nc_model_stats_v2_pkey PRIMARY KEY (fk_workspace_id, base_id, fk_model_id);


--
-- Name: nc_models_v2 nc_models_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_models_v2
    ADD CONSTRAINT nc_models_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_oauth_authorization_codes nc_oauth_authorization_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_oauth_authorization_codes
    ADD CONSTRAINT nc_oauth_authorization_codes_pkey PRIMARY KEY (code);


--
-- Name: nc_oauth_clients nc_oauth_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_oauth_clients
    ADD CONSTRAINT nc_oauth_clients_pkey PRIMARY KEY (client_id);


--
-- Name: nc_oauth_tokens nc_oauth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_oauth_tokens
    ADD CONSTRAINT nc_oauth_tokens_pkey PRIMARY KEY (id);


--
-- Name: nc_org_domain nc_org_domain_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_org_domain
    ADD CONSTRAINT nc_org_domain_pkey PRIMARY KEY (id);


--
-- Name: nc_org nc_org_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_org
    ADD CONSTRAINT nc_org_pkey PRIMARY KEY (id);


--
-- Name: nc_org_users nc_org_users_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_org_users
    ADD CONSTRAINT nc_org_users_pkey PRIMARY KEY (fk_org_id, fk_user_id);


--
-- Name: nc_list_view_columns_v2 nc_outline_view_columns_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_list_view_columns_v2
    ADD CONSTRAINT nc_outline_view_columns_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_list_view_levels_v2 nc_outline_view_levels_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_list_view_levels_v2
    ADD CONSTRAINT nc_outline_view_levels_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_list_view_v2 nc_outline_view_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_list_view_v2
    ADD CONSTRAINT nc_outline_view_v2_pkey PRIMARY KEY (base_id, fk_view_id);


--
-- Name: nc_permission_subjects nc_permission_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_permission_subjects
    ADD CONSTRAINT nc_permission_subjects_pkey PRIMARY KEY (base_id, fk_permission_id, subject_type, subject_id);


--
-- Name: nc_permissions nc_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_permissions
    ADD CONSTRAINT nc_permissions_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_plans nc_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_plans
    ADD CONSTRAINT nc_plans_pkey PRIMARY KEY (id);


--
-- Name: nc_plugins_v2 nc_plugins_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_plugins_v2
    ADD CONSTRAINT nc_plugins_v2_pkey PRIMARY KEY (id);


--
-- Name: nc_principal_assignments nc_principal_assignments_pk; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_principal_assignments
    ADD CONSTRAINT nc_principal_assignments_pk PRIMARY KEY (resource_type, resource_id, principal_type, principal_ref_id);


--
-- Name: nc_bases_v2 nc_projects_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_bases_v2
    ADD CONSTRAINT nc_projects_v2_pkey PRIMARY KEY (id);


--
-- Name: nc_record_templates nc_record_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_record_templates
    ADD CONSTRAINT nc_record_templates_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_rls_policies nc_rls_policies_pk; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_rls_policies
    ADD CONSTRAINT nc_rls_policies_pk PRIMARY KEY (base_id, id);


--
-- Name: nc_rls_policy_subjects nc_rls_policy_subjects_pk; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_rls_policy_subjects
    ADD CONSTRAINT nc_rls_policy_subjects_pk PRIMARY KEY (fk_rls_policy_id, subject_type, subject_id);


--
-- Name: nc_row_color_conditions nc_row_color_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_row_color_conditions
    ADD CONSTRAINT nc_row_color_conditions_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_sandbox_changelog nc_sandbox_changelog_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_sandbox_changelog
    ADD CONSTRAINT nc_sandbox_changelog_pkey PRIMARY KEY (id);


--
-- Name: nc_managed_app_deployment_logs nc_sandbox_deployment_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_managed_app_deployment_logs
    ADD CONSTRAINT nc_sandbox_deployment_logs_pkey PRIMARY KEY (id);


--
-- Name: nc_managed_app_versions nc_sandbox_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_managed_app_versions
    ADD CONSTRAINT nc_sandbox_versions_pkey PRIMARY KEY (id);


--
-- Name: nc_managed_apps nc_sandboxes_base_id_unique; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_managed_apps
    ADD CONSTRAINT nc_sandboxes_base_id_unique UNIQUE (base_id);


--
-- Name: nc_managed_apps nc_sandboxes_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_managed_apps
    ADD CONSTRAINT nc_sandboxes_pkey PRIMARY KEY (id);


--
-- Name: nc_sandboxes_v2 nc_sandboxes_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_sandboxes_v2
    ADD CONSTRAINT nc_sandboxes_v2_pkey PRIMARY KEY (id);


--
-- Name: nc_scim_config nc_scim_config_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_scim_config
    ADD CONSTRAINT nc_scim_config_pkey PRIMARY KEY (id);


--
-- Name: nc_scripts nc_scripts_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_scripts
    ADD CONSTRAINT nc_scripts_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_snapshots nc_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_snapshots
    ADD CONSTRAINT nc_snapshots_pkey PRIMARY KEY (id);


--
-- Name: nc_sort_v2 nc_sort_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_sort_v2
    ADD CONSTRAINT nc_sort_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_sql_executor_v2 nc_sql_executor_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_sql_executor_v2
    ADD CONSTRAINT nc_sql_executor_v2_pkey PRIMARY KEY (id);


--
-- Name: nc_sso_client_domain nc_sso_client_domain_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_sso_client_domain
    ADD CONSTRAINT nc_sso_client_domain_pkey PRIMARY KEY (fk_sso_client_id);


--
-- Name: nc_sso_client nc_sso_client_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_sso_client
    ADD CONSTRAINT nc_sso_client_pkey PRIMARY KEY (id);


--
-- Name: nc_store nc_store_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_store
    ADD CONSTRAINT nc_store_pkey PRIMARY KEY (id);


--
-- Name: nc_subscriptions nc_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_subscriptions
    ADD CONSTRAINT nc_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: nc_sync_configs nc_sync_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_sync_configs
    ADD CONSTRAINT nc_sync_configs_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_sync_logs_v2 nc_sync_logs_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_sync_logs_v2
    ADD CONSTRAINT nc_sync_logs_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_sync_mappings nc_sync_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_sync_mappings
    ADD CONSTRAINT nc_sync_mappings_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_sync_source_v2 nc_sync_source_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_sync_source_v2
    ADD CONSTRAINT nc_sync_source_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_teams nc_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_teams
    ADD CONSTRAINT nc_teams_pkey PRIMARY KEY (id);


--
-- Name: nc_teams nc_teams_scim_external_id_unique; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_teams
    ADD CONSTRAINT nc_teams_scim_external_id_unique UNIQUE (scim_external_id);


--
-- Name: nc_timeline_view_columns_v2 nc_timeline_view_columns_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_timeline_view_columns_v2
    ADD CONSTRAINT nc_timeline_view_columns_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_timeline_view_range_v2 nc_timeline_view_range_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_timeline_view_range_v2
    ADD CONSTRAINT nc_timeline_view_range_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_timeline_view_v2 nc_timeline_view_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_timeline_view_v2
    ADD CONSTRAINT nc_timeline_view_v2_pkey PRIMARY KEY (base_id, fk_view_id);


--
-- Name: nc_trash nc_trash_base_id_resource_type_resource_id_unique; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_trash
    ADD CONSTRAINT nc_trash_base_id_resource_type_resource_id_unique UNIQUE (base_id, resource_type, resource_id);


--
-- Name: nc_trash nc_trash_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_trash
    ADD CONSTRAINT nc_trash_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_usage_stats nc_usage_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_usage_stats
    ADD CONSTRAINT nc_usage_stats_pkey PRIMARY KEY (fk_workspace_id, usage_type, period_start);


--
-- Name: nc_user_comment_notifications_preference nc_user_comment_notifications_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_user_comment_notifications_preference
    ADD CONSTRAINT nc_user_comment_notifications_preference_pkey PRIMARY KEY (id);


--
-- Name: nc_users_v2 nc_users_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_users_v2
    ADD CONSTRAINT nc_users_v2_pkey PRIMARY KEY (id);


--
-- Name: nc_view_sections nc_view_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_view_sections
    ADD CONSTRAINT nc_view_sections_pkey PRIMARY KEY (id);


--
-- Name: nc_views_v2 nc_views_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_views_v2
    ADD CONSTRAINT nc_views_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_widgets_v2 nc_widgets_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_widgets_v2
    ADD CONSTRAINT nc_widgets_v2_pkey PRIMARY KEY (base_id, id);


--
-- Name: nc_workflows nc_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.nc_workflows
    ADD CONSTRAINT nc_workflows_pkey PRIMARY KEY (id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: outlook_calendar_events_cache outlook_calendar_events_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.outlook_calendar_events_cache
    ADD CONSTRAINT outlook_calendar_events_cache_pkey PRIMARY KEY (id);


--
-- Name: outlook_calendar_events_cache outlook_calendar_events_cache_user_id_outlook_event_id_key; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.outlook_calendar_events_cache
    ADD CONSTRAINT outlook_calendar_events_cache_user_id_outlook_event_id_key UNIQUE (user_id, outlook_event_id);


--
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- Name: requests requests_request_id_key; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_request_id_key UNIQUE (request_id);


--
-- Name: sop_approvals sop_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_approvals
    ADD CONSTRAINT sop_approvals_pkey PRIMARY KEY (id);


--
-- Name: sop_run_steps sop_run_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_run_steps
    ADD CONSTRAINT sop_run_steps_pkey PRIMARY KEY (id);


--
-- Name: sop_runs sop_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_runs
    ADD CONSTRAINT sop_runs_pkey PRIMARY KEY (id);


--
-- Name: sop_steps sop_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_steps
    ADD CONSTRAINT sop_steps_pkey PRIMARY KEY (id);


--
-- Name: sops sops_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sops
    ADD CONSTRAINT sops_pkey PRIMARY KEY (id);


--
-- Name: system_audit_logs system_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.system_audit_logs
    ADD CONSTRAINT system_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: timeclock_entries timeclock_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.timeclock_entries
    ADD CONSTRAINT timeclock_entries_pkey PRIMARY KEY (id);


--
-- Name: timesheets timesheets_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_pkey PRIMARY KEY (id);


--
-- Name: work_orders work_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_pkey PRIMARY KEY (id);


--
-- Name: workspace workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_pkey PRIMARY KEY (id);


--
-- Name: workspace_user workspace_user_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.workspace_user
    ADD CONSTRAINT workspace_user_pkey PRIMARY KEY (fk_workspace_id, fk_user_id);


--
-- Name: xc_knex_migrationsv0_lock xc_knex_migrationsv0_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.xc_knex_migrationsv0_lock
    ADD CONSTRAINT xc_knex_migrationsv0_lock_pkey PRIMARY KEY (index);


--
-- Name: xc_knex_migrationsv0 xc_knex_migrationsv0_pkey; Type: CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.xc_knex_migrationsv0
    ADD CONSTRAINT xc_knex_migrationsv0_pkey PRIMARY KEY (id);


--
-- Name: Features_deleted_idx; Type: INDEX; Schema: pdino8tpcml3eup; Owner: diversified
--

CREATE INDEX "Features_deleted_idx" ON pdino8tpcml3eup."Features" USING btree (__nc_deleted);


--
-- Name: Features_order_idx; Type: INDEX; Schema: pdino8tpcml3eup; Owner: diversified
--

CREATE INDEX "Features_order_idx" ON pdino8tpcml3eup."Features" USING btree (nc_order);


--
-- Name: document_audit_logs_document_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX document_audit_logs_document_idx ON public.document_audit_logs USING btree (document_id, created_at DESC);


--
-- Name: document_signatures_document_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX document_signatures_document_idx ON public.document_signatures USING btree (document_id, signature_order);


--
-- Name: document_versions_unique_version; Type: INDEX; Schema: public; Owner: diversified
--

CREATE UNIQUE INDEX document_versions_unique_version ON public.document_versions USING btree (document_id, version_number);


--
-- Name: employees_auth_subject_unique; Type: INDEX; Schema: public; Owner: diversified
--

CREATE UNIQUE INDEX employees_auth_subject_unique ON public.employees USING btree (auth_provider, auth_subject) WHERE (auth_subject IS NOT NULL);


--
-- Name: employees_email_unique; Type: INDEX; Schema: public; Owner: diversified
--

CREATE UNIQUE INDEX employees_email_unique ON public.employees USING btree (lower((email)::text)) WHERE (email IS NOT NULL);


--
-- Name: file_records_created_at_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX file_records_created_at_idx ON public.file_records USING btree (created_at DESC);


--
-- Name: file_records_linked_entity_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX file_records_linked_entity_idx ON public.file_records USING btree (linked_entity_type, linked_entity_id);


--
-- Name: file_records_stored_name_unique; Type: INDEX; Schema: public; Owner: diversified
--

CREATE UNIQUE INDEX file_records_stored_name_unique ON public.file_records USING btree (stored_name) WHERE (stored_name IS NOT NULL);


--
-- Name: idx_api_token_scopes_resource; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_api_token_scopes_resource ON public.nc_api_token_scopes USING btree (resource_type, resource_id);


--
-- Name: idx_api_token_scopes_token; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_api_token_scopes_token ON public.nc_api_token_scopes USING btree (fk_api_token_id);


--
-- Name: idx_audit_logs_actor_user_id; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_audit_logs_actor_user_id ON public.audit_logs USING btree (actor_user_id);


--
-- Name: idx_audit_logs_actor_user_id_text; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_audit_logs_actor_user_id_text ON public.audit_logs USING btree (actor_user_id_text);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_entity_text; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_audit_logs_entity_text ON public.audit_logs USING btree (entity_type, entity_id_text);


--
-- Name: idx_audit_logs_module_action_created_at; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_audit_logs_module_action_created_at ON public.audit_logs USING btree (module, action, created_at DESC);


--
-- Name: idx_automation_events_entity; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_automation_events_entity ON public.automation_events USING btree (entity_type, entity_id);


--
-- Name: idx_automation_events_processed_at; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_automation_events_processed_at ON public.automation_events USING btree (processed_at DESC);


--
-- Name: idx_automation_events_status_created_at; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_automation_events_status_created_at ON public.automation_events USING btree (status, created_at DESC);


--
-- Name: idx_automation_events_type_source; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_automation_events_type_source ON public.automation_events USING btree (event_type, source_module);


--
-- Name: idx_calendar_blocks_assigned_employee_start_time; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_calendar_blocks_assigned_employee_start_time ON public.calendar_blocks USING btree (assigned_to_employee_id, start_time);


--
-- Name: idx_calendar_blocks_assigned_to_start_time; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_calendar_blocks_assigned_to_start_time ON public.calendar_blocks USING btree (assigned_to, start_time);


--
-- Name: idx_calendar_blocks_linked_task; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_calendar_blocks_linked_task ON public.calendar_blocks USING btree (linked_task_id);


--
-- Name: idx_calendar_blocks_linked_task_int; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_calendar_blocks_linked_task_int ON public.calendar_blocks USING btree (linked_task_int_id);


--
-- Name: idx_calendar_blocks_linked_work_order; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_calendar_blocks_linked_work_order ON public.calendar_blocks USING btree (linked_work_order_id);


--
-- Name: idx_calendar_blocks_start_time; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_calendar_blocks_start_time ON public.calendar_blocks USING btree (start_time);


--
-- Name: idx_calendar_blocks_status; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_calendar_blocks_status ON public.calendar_blocks USING btree (status);


--
-- Name: idx_calendar_sync_logs_provider_started; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_calendar_sync_logs_provider_started ON public.calendar_sync_logs USING btree (provider, started_at DESC);


--
-- Name: idx_documents_category; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_documents_category ON public.documents USING btree (category);


--
-- Name: idx_documents_file_id; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_documents_file_id ON public.documents USING btree (file_id);


--
-- Name: idx_documents_owner_id; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_documents_owner_id ON public.documents USING btree (owner_id);


--
-- Name: idx_documents_status; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_documents_status ON public.documents USING btree (status);


--
-- Name: idx_employees_department; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_employees_department ON public.employees USING btree (department);


--
-- Name: idx_employees_email_lower; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_employees_email_lower ON public.employees USING btree (lower((email)::text));


--
-- Name: idx_employees_name_lower; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_employees_name_lower ON public.employees USING btree (lower((name)::text));


--
-- Name: idx_files_category; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_files_category ON public.files USING btree (category);


--
-- Name: idx_files_linked_entity; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_files_linked_entity ON public.files USING btree (linked_entity_type, linked_entity_id);


--
-- Name: idx_files_original_name_lower; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_files_original_name_lower ON public.files USING btree (lower(original_name));


--
-- Name: idx_files_stored_name_unique; Type: INDEX; Schema: public; Owner: diversified
--

CREATE UNIQUE INDEX idx_files_stored_name_unique ON public.files USING btree (stored_name);


--
-- Name: idx_files_uploaded_by; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_files_uploaded_by ON public.files USING btree (uploaded_by);


--
-- Name: idx_microsoft_connections_user_id; Type: INDEX; Schema: public; Owner: diversified
--

CREATE UNIQUE INDEX idx_microsoft_connections_user_id ON public.microsoft_connections USING btree (user_id);


--
-- Name: idx_nc_form_view_columns_row_id; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_nc_form_view_columns_row_id ON public.nc_form_view_columns_v2 USING btree (row_id);


--
-- Name: idx_outlook_events_user_time; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_outlook_events_user_time ON public.outlook_calendar_events_cache USING btree (user_id, start_time, end_time);


--
-- Name: idx_requests_assigned_reviewer; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_requests_assigned_reviewer ON public.requests USING btree (assigned_reviewer);


--
-- Name: idx_requests_assignee; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_requests_assignee ON public.requests USING btree (assignee);


--
-- Name: idx_requests_category; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_requests_category ON public.requests USING btree (category);


--
-- Name: idx_requests_request_id; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_requests_request_id ON public.requests USING btree (request_id);


--
-- Name: idx_requests_request_number; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_requests_request_number ON public.requests USING btree (request_number);


--
-- Name: idx_requests_status; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_requests_status ON public.requests USING btree (status);


--
-- Name: idx_sop_approvals_run_status; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_sop_approvals_run_status ON public.sop_approvals USING btree (sop_run_id, status);


--
-- Name: idx_sop_approvals_status_created; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_sop_approvals_status_created ON public.sop_approvals USING btree (status, created_at DESC);


--
-- Name: idx_sop_run_steps_run_order; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_sop_run_steps_run_order ON public.sop_run_steps USING btree (sop_run_id, step_order);


--
-- Name: idx_sop_run_steps_status; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_sop_run_steps_status ON public.sop_run_steps USING btree (status);


--
-- Name: idx_sop_run_steps_unique_step; Type: INDEX; Schema: public; Owner: diversified
--

CREATE UNIQUE INDEX idx_sop_run_steps_unique_step ON public.sop_run_steps USING btree (sop_run_id, sop_step_id);


--
-- Name: idx_sop_runs_assigned_to; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_sop_runs_assigned_to ON public.sop_runs USING btree (assigned_to);


--
-- Name: idx_sop_runs_sop_id; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_sop_runs_sop_id ON public.sop_runs USING btree (sop_id);


--
-- Name: idx_sop_runs_status_updated; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_sop_runs_status_updated ON public.sop_runs USING btree (status, updated_at DESC);


--
-- Name: idx_sop_steps_sop_id; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_sop_steps_sop_id ON public.sop_steps USING btree (sop_id);


--
-- Name: idx_sop_steps_sop_order; Type: INDEX; Schema: public; Owner: diversified
--

CREATE UNIQUE INDEX idx_sop_steps_sop_order ON public.sop_steps USING btree (sop_id, step_order);


--
-- Name: idx_sops_category; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_sops_category ON public.sops USING btree (category);


--
-- Name: idx_sops_status; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_sops_status ON public.sops USING btree (status);


--
-- Name: idx_sops_title_lower; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_sops_title_lower ON public.sops USING btree (lower((title)::text));


--
-- Name: idx_system_audit_logs_created_at; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_system_audit_logs_created_at ON public.system_audit_logs USING btree (created_at DESC);


--
-- Name: idx_system_audit_logs_module; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_system_audit_logs_module ON public.system_audit_logs USING btree (module);


--
-- Name: idx_tasks_assigned_to; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_tasks_assigned_to ON public.tasks USING btree (assigned_to);


--
-- Name: idx_tasks_priority; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_tasks_priority ON public.tasks USING btree (priority);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: idx_tasks_status_priority_assigned_to; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_tasks_status_priority_assigned_to ON public.tasks USING btree (status, priority, assigned_to);


--
-- Name: idx_tasks_title_lower; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_tasks_title_lower ON public.tasks USING btree (lower((title)::text));


--
-- Name: idx_work_orders_owner; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_work_orders_owner ON public.work_orders USING btree (owner);


--
-- Name: idx_work_orders_priority; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_work_orders_priority ON public.work_orders USING btree (priority);


--
-- Name: idx_work_orders_status; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_work_orders_status ON public.work_orders USING btree (status);


--
-- Name: idx_work_orders_status_priority; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX idx_work_orders_status_priority ON public.work_orders USING btree (status, priority);


--
-- Name: nc_api_tokens_fk_sso_client_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_api_tokens_fk_sso_client_id_index ON public.nc_api_tokens USING btree (fk_sso_client_id);


--
-- Name: nc_api_tokens_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_api_tokens_fk_user_id_index ON public.nc_api_tokens USING btree (fk_user_id);


--
-- Name: nc_audit_v2_fk_org_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_audit_v2_fk_org_id_idx ON public.nc_audit_v2 USING btree (fk_org_id);


--
-- Name: nc_audit_v2_fk_workspace_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_audit_v2_fk_workspace_idx ON public.nc_audit_v2 USING btree (fk_workspace_id);


--
-- Name: nc_audit_v2_old_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_audit_v2_old_id_index ON public.nc_audit_v2 USING btree (old_id);


--
-- Name: nc_audit_v2_tenant_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_audit_v2_tenant_idx ON public.nc_audit_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_automation_executions_error_notify_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_automation_executions_error_notify_idx ON public.nc_automation_executions USING btree (status, error_notified_at);


--
-- Name: nc_automation_executions_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_automation_executions_oldpk_idx ON public.nc_automation_executions USING btree (id);


--
-- Name: nc_automation_executions_resume_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_automation_executions_resume_idx ON public.nc_automation_executions USING btree (fk_workspace_id, base_id, resume_at);


--
-- Name: nc_automation_subscribers_automation_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_automation_subscribers_automation_idx ON public.nc_automation_subscribers USING btree (fk_automation_id);


--
-- Name: nc_automation_subscribers_user_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_automation_subscribers_user_idx ON public.nc_automation_subscribers USING btree (fk_user_id);


--
-- Name: nc_automations_context_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_automations_context_idx ON public.nc_automations USING btree (base_id, fk_workspace_id);


--
-- Name: nc_automations_enabled_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_automations_enabled_idx ON public.nc_automations USING btree (enabled);


--
-- Name: nc_automations_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_automations_oldpk_idx ON public.nc_automations USING btree (id);


--
-- Name: nc_automations_order_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_automations_order_idx ON public.nc_automations USING btree (base_id, "order");


--
-- Name: nc_automations_type_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_automations_type_idx ON public.nc_automations USING btree (type);


--
-- Name: nc_base_users_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_base_users_v2_base_id_fk_workspace_id_index ON public.nc_base_users_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_base_users_v2_invited_by_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_base_users_v2_invited_by_index ON public.nc_base_users_v2 USING btree (invited_by);


--
-- Name: nc_base_variables_base_ws_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_base_variables_base_ws_index ON public.nc_base_variables USING btree (base_id, fk_workspace_id);


--
-- Name: nc_bases_is_sandbox_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_bases_is_sandbox_idx ON public.nc_bases_v2 USING btree (is_sandbox);


--
-- Name: nc_bases_is_sandbox_production_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_bases_is_sandbox_production_idx ON public.nc_bases_v2 USING btree (is_sandbox_production);


--
-- Name: nc_bases_managed_app_auto_update_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_bases_managed_app_auto_update_idx ON public.nc_bases_v2 USING btree (managed_app_id, auto_update);


--
-- Name: nc_bases_managed_app_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_bases_managed_app_id_idx ON public.nc_bases_v2 USING btree (managed_app_id);


--
-- Name: nc_bases_managed_app_master_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_bases_managed_app_master_idx ON public.nc_bases_v2 USING btree (managed_app_master);


--
-- Name: nc_bases_managed_app_version_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_bases_managed_app_version_id_idx ON public.nc_bases_v2 USING btree (managed_app_version_id);


--
-- Name: nc_bases_v2_fk_custom_url_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_bases_v2_fk_custom_url_id_index ON public.nc_bases_v2 USING btree (fk_custom_url_id);


--
-- Name: nc_bases_v2_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_bases_v2_fk_workspace_id_index ON public.nc_bases_v2 USING btree (fk_workspace_id);


--
-- Name: nc_calendar_view_columns_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_calendar_view_columns_v2_base_id_fk_workspace_id_index ON public.nc_calendar_view_columns_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_calendar_view_columns_v2_fk_view_id_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_calendar_view_columns_v2_fk_view_id_fk_column_id_index ON public.nc_calendar_view_columns_v2 USING btree (fk_view_id, fk_column_id);


--
-- Name: nc_calendar_view_columns_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_calendar_view_columns_v2_oldpk_idx ON public.nc_calendar_view_columns_v2 USING btree (id);


--
-- Name: nc_calendar_view_range_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_calendar_view_range_v2_base_id_fk_workspace_id_index ON public.nc_calendar_view_range_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_calendar_view_range_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_calendar_view_range_v2_oldpk_idx ON public.nc_calendar_view_range_v2 USING btree (id);


--
-- Name: nc_calendar_view_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_calendar_view_v2_base_id_fk_workspace_id_index ON public.nc_calendar_view_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_calendar_view_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_calendar_view_v2_oldpk_idx ON public.nc_calendar_view_v2 USING btree (fk_view_id);


--
-- Name: nc_chat_messages_session_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_chat_messages_session_idx ON public.nc_chat_messages USING btree (fk_session_id);


--
-- Name: nc_chat_sessions_user_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_chat_sessions_user_idx ON public.nc_chat_sessions USING btree (fk_user_id);


--
-- Name: nc_col_barcode_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_barcode_v2_base_id_fk_workspace_id_index ON public.nc_col_barcode_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_col_barcode_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_barcode_v2_fk_column_id_index ON public.nc_col_barcode_v2 USING btree (fk_column_id);


--
-- Name: nc_col_barcode_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_barcode_v2_oldpk_idx ON public.nc_col_barcode_v2 USING btree (id);


--
-- Name: nc_col_button_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_button_context ON public.nc_col_button_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_col_button_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_button_v2_fk_column_id_index ON public.nc_col_button_v2 USING btree (fk_column_id);


--
-- Name: nc_col_button_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_button_v2_oldpk_idx ON public.nc_col_button_v2 USING btree (id);


--
-- Name: nc_col_formula_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_formula_v2_base_id_fk_workspace_id_index ON public.nc_col_formula_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_col_formula_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_formula_v2_fk_column_id_index ON public.nc_col_formula_v2 USING btree (fk_column_id);


--
-- Name: nc_col_formula_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_formula_v2_oldpk_idx ON public.nc_col_formula_v2 USING btree (id);


--
-- Name: nc_col_long_text_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_long_text_context ON public.nc_col_long_text_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_col_long_text_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_long_text_v2_fk_column_id_index ON public.nc_col_long_text_v2 USING btree (fk_column_id);


--
-- Name: nc_col_long_text_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_long_text_v2_oldpk_idx ON public.nc_col_long_text_v2 USING btree (id);


--
-- Name: nc_col_lookup_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_lookup_v2_base_id_fk_workspace_id_index ON public.nc_col_lookup_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_col_lookup_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_lookup_v2_fk_column_id_index ON public.nc_col_lookup_v2 USING btree (fk_column_id);


--
-- Name: nc_col_lookup_v2_fk_lookup_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_lookup_v2_fk_lookup_column_id_index ON public.nc_col_lookup_v2 USING btree (fk_lookup_column_id);


--
-- Name: nc_col_lookup_v2_fk_relation_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_lookup_v2_fk_relation_column_id_index ON public.nc_col_lookup_v2 USING btree (fk_relation_column_id);


--
-- Name: nc_col_lookup_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_lookup_v2_oldpk_idx ON public.nc_col_lookup_v2 USING btree (id);


--
-- Name: nc_col_qrcode_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_qrcode_v2_base_id_fk_workspace_id_index ON public.nc_col_qrcode_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_col_qrcode_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_qrcode_v2_fk_column_id_index ON public.nc_col_qrcode_v2 USING btree (fk_column_id);


--
-- Name: nc_col_qrcode_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_qrcode_v2_oldpk_idx ON public.nc_col_qrcode_v2 USING btree (id);


--
-- Name: nc_col_relations_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_relations_v2_base_id_fk_workspace_id_index ON public.nc_col_relations_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_col_relations_v2_fk_child_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_relations_v2_fk_child_column_id_index ON public.nc_col_relations_v2 USING btree (fk_child_column_id);


--
-- Name: nc_col_relations_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_relations_v2_fk_column_id_index ON public.nc_col_relations_v2 USING btree (fk_column_id);


--
-- Name: nc_col_relations_v2_fk_display_value_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_relations_v2_fk_display_value_column_id_index ON public.nc_col_relations_v2 USING btree (fk_display_value_column_id);


--
-- Name: nc_col_relations_v2_fk_mm_child_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_relations_v2_fk_mm_child_column_id_index ON public.nc_col_relations_v2 USING btree (fk_mm_child_column_id);


--
-- Name: nc_col_relations_v2_fk_mm_model_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_relations_v2_fk_mm_model_id_index ON public.nc_col_relations_v2 USING btree (fk_mm_model_id);


--
-- Name: nc_col_relations_v2_fk_mm_parent_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_relations_v2_fk_mm_parent_column_id_index ON public.nc_col_relations_v2 USING btree (fk_mm_parent_column_id);


--
-- Name: nc_col_relations_v2_fk_parent_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_relations_v2_fk_parent_column_id_index ON public.nc_col_relations_v2 USING btree (fk_parent_column_id);


--
-- Name: nc_col_relations_v2_fk_related_model_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_relations_v2_fk_related_model_id_index ON public.nc_col_relations_v2 USING btree (fk_related_model_id);


--
-- Name: nc_col_relations_v2_fk_target_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_relations_v2_fk_target_view_id_index ON public.nc_col_relations_v2 USING btree (fk_target_view_id);


--
-- Name: nc_col_relations_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_relations_v2_oldpk_idx ON public.nc_col_relations_v2 USING btree (id);


--
-- Name: nc_col_rollup_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_rollup_v2_base_id_fk_workspace_id_index ON public.nc_col_rollup_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_col_rollup_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_rollup_v2_fk_column_id_index ON public.nc_col_rollup_v2 USING btree (fk_column_id);


--
-- Name: nc_col_rollup_v2_fk_relation_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_rollup_v2_fk_relation_column_id_index ON public.nc_col_rollup_v2 USING btree (fk_relation_column_id);


--
-- Name: nc_col_rollup_v2_fk_rollup_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_rollup_v2_fk_rollup_column_id_index ON public.nc_col_rollup_v2 USING btree (fk_rollup_column_id);


--
-- Name: nc_col_rollup_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_rollup_v2_oldpk_idx ON public.nc_col_rollup_v2 USING btree (id);


--
-- Name: nc_col_select_options_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_select_options_v2_base_id_fk_workspace_id_index ON public.nc_col_select_options_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_col_select_options_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_select_options_v2_fk_column_id_index ON public.nc_col_select_options_v2 USING btree (fk_column_id);


--
-- Name: nc_col_select_options_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_col_select_options_v2_oldpk_idx ON public.nc_col_select_options_v2 USING btree (id);


--
-- Name: nc_columns_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_columns_v2_base_id_fk_workspace_id_index ON public.nc_columns_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_columns_v2_fk_model_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_columns_v2_fk_model_id_index ON public.nc_columns_v2 USING btree (fk_model_id);


--
-- Name: nc_columns_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_columns_v2_oldpk_idx ON public.nc_columns_v2 USING btree (id);


--
-- Name: nc_comment_reactions_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_comment_reactions_base_id_fk_workspace_id_index ON public.nc_comment_reactions USING btree (base_id, fk_workspace_id);


--
-- Name: nc_comment_reactions_comment_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_comment_reactions_comment_id_index ON public.nc_comment_reactions USING btree (comment_id);


--
-- Name: nc_comment_reactions_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_comment_reactions_oldpk_idx ON public.nc_comment_reactions USING btree (id);


--
-- Name: nc_comment_reactions_row_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_comment_reactions_row_id_index ON public.nc_comment_reactions USING btree (row_id);


--
-- Name: nc_comments_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_comments_base_id_fk_workspace_id_index ON public.nc_comments USING btree (base_id, fk_workspace_id);


--
-- Name: nc_comments_doc_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_comments_doc_idx ON public.nc_comments USING btree (fk_doc_id);


--
-- Name: nc_comments_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_comments_oldpk_idx ON public.nc_comments USING btree (id);


--
-- Name: nc_comments_row_id_fk_model_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_comments_row_id_fk_model_id_index ON public.nc_comments USING btree (row_id, fk_model_id);


--
-- Name: nc_custom_urls_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_custom_urls_context ON public.nc_custom_urls_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_custom_urls_v2_custom_path_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_custom_urls_v2_custom_path_index ON public.nc_custom_urls_v2 USING btree (custom_path);


--
-- Name: nc_custom_urls_v2_fk_dashboard_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_custom_urls_v2_fk_dashboard_id_index ON public.nc_custom_urls_v2 USING btree (fk_dashboard_id);


--
-- Name: nc_custom_urls_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_custom_urls_v2_oldpk_idx ON public.nc_custom_urls_v2 USING btree (id);


--
-- Name: nc_dashboards_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_dashboards_context ON public.nc_dashboards_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_dashboards_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_dashboards_v2_oldpk_idx ON public.nc_dashboards_v2 USING btree (id);


--
-- Name: nc_data_reflection_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_data_reflection_fk_workspace_id_index ON public.nc_data_reflection USING btree (fk_workspace_id);


--
-- Name: nc_date_dep_context_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_date_dep_context_idx ON public.nc_date_dependency_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_date_dep_model_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_date_dep_model_idx ON public.nc_date_dependency_v2 USING btree (fk_model_id);


--
-- Name: nc_dependency_tracker_context_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_dependency_tracker_context_idx ON public.nc_dependency_tracker USING btree (base_id, fk_workspace_id);


--
-- Name: nc_dependency_tracker_dependent_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_dependency_tracker_dependent_idx ON public.nc_dependency_tracker USING btree (dependent_type, dependent_id);


--
-- Name: nc_dependency_tracker_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_dependency_tracker_oldpk_idx ON public.nc_dependency_tracker USING btree (id);


--
-- Name: nc_dependency_tracker_queryable_field_0_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_dependency_tracker_queryable_field_0_idx ON public.nc_dependency_tracker USING btree (queryable_field_0);


--
-- Name: nc_dependency_tracker_queryable_field_1_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_dependency_tracker_queryable_field_1_idx ON public.nc_dependency_tracker USING btree (queryable_field_1);


--
-- Name: nc_dependency_tracker_queryable_field_2_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_dependency_tracker_queryable_field_2_idx ON public.nc_dependency_tracker USING btree (queryable_field_2);


--
-- Name: nc_dependency_tracker_source_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_dependency_tracker_source_idx ON public.nc_dependency_tracker USING btree (source_type, source_id);


--
-- Name: nc_disabled_models_for_role_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_disabled_models_for_role_v2_base_id_fk_workspace_id_index ON public.nc_disabled_models_for_role_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_disabled_models_for_role_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_disabled_models_for_role_v2_fk_view_id_index ON public.nc_disabled_models_for_role_v2 USING btree (fk_view_id);


--
-- Name: nc_disabled_models_for_role_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_disabled_models_for_role_v2_oldpk_idx ON public.nc_disabled_models_for_role_v2 USING btree (id);


--
-- Name: nc_doc_content_v2_tenant_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_doc_content_v2_tenant_idx ON public.nc_doc_content_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_docs_v2_tenant_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_docs_v2_tenant_idx ON public.nc_docs_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_docs_v2_tree_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_docs_v2_tree_idx ON public.nc_docs_v2 USING btree (base_id, parent_id, "order");


--
-- Name: nc_extensions_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_extensions_base_id_fk_workspace_id_index ON public.nc_extensions USING btree (base_id, fk_workspace_id);


--
-- Name: nc_extensions_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_extensions_oldpk_idx ON public.nc_extensions USING btree (id);


--
-- Name: nc_filter_exp_rls_policy_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_filter_exp_rls_policy_idx ON public.nc_filter_exp_v2 USING btree (fk_rls_policy_id);


--
-- Name: nc_filter_exp_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_filter_exp_v2_base_id_fk_workspace_id_index ON public.nc_filter_exp_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_filter_exp_v2_fk_button_col_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_filter_exp_v2_fk_button_col_id_index ON public.nc_filter_exp_v2 USING btree (fk_button_col_id);


--
-- Name: nc_filter_exp_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_filter_exp_v2_fk_column_id_index ON public.nc_filter_exp_v2 USING btree (fk_column_id);


--
-- Name: nc_filter_exp_v2_fk_hook_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_filter_exp_v2_fk_hook_id_index ON public.nc_filter_exp_v2 USING btree (fk_hook_id);


--
-- Name: nc_filter_exp_v2_fk_level_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_filter_exp_v2_fk_level_id_index ON public.nc_filter_exp_v2 USING btree (fk_level_id);


--
-- Name: nc_filter_exp_v2_fk_link_col_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_filter_exp_v2_fk_link_col_id_index ON public.nc_filter_exp_v2 USING btree (fk_link_col_id);


--
-- Name: nc_filter_exp_v2_fk_parent_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_filter_exp_v2_fk_parent_column_id_index ON public.nc_filter_exp_v2 USING btree (fk_parent_column_id);


--
-- Name: nc_filter_exp_v2_fk_parent_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_filter_exp_v2_fk_parent_id_index ON public.nc_filter_exp_v2 USING btree (fk_parent_id);


--
-- Name: nc_filter_exp_v2_fk_value_col_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_filter_exp_v2_fk_value_col_id_index ON public.nc_filter_exp_v2 USING btree (fk_value_col_id);


--
-- Name: nc_filter_exp_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_filter_exp_v2_fk_view_id_index ON public.nc_filter_exp_v2 USING btree (fk_view_id);


--
-- Name: nc_filter_exp_v2_fk_widget_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_filter_exp_v2_fk_widget_id_index ON public.nc_filter_exp_v2 USING btree (fk_widget_id);


--
-- Name: nc_filter_exp_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_filter_exp_v2_oldpk_idx ON public.nc_filter_exp_v2 USING btree (id);


--
-- Name: nc_follower_fk_follower_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_follower_fk_follower_id_index ON public.nc_follower USING btree (fk_follower_id);


--
-- Name: nc_follower_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_follower_fk_user_id_index ON public.nc_follower USING btree (fk_user_id);


--
-- Name: nc_form_view_columns_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_form_view_columns_v2_base_id_fk_workspace_id_index ON public.nc_form_view_columns_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_form_view_columns_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_form_view_columns_v2_fk_column_id_index ON public.nc_form_view_columns_v2 USING btree (fk_column_id);


--
-- Name: nc_form_view_columns_v2_fk_view_id_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_form_view_columns_v2_fk_view_id_fk_column_id_index ON public.nc_form_view_columns_v2 USING btree (fk_view_id, fk_column_id);


--
-- Name: nc_form_view_columns_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_form_view_columns_v2_fk_view_id_index ON public.nc_form_view_columns_v2 USING btree (fk_view_id);


--
-- Name: nc_form_view_columns_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_form_view_columns_v2_oldpk_idx ON public.nc_form_view_columns_v2 USING btree (id);


--
-- Name: nc_form_view_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_form_view_v2_base_id_fk_workspace_id_index ON public.nc_form_view_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_form_view_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_form_view_v2_fk_view_id_index ON public.nc_form_view_v2 USING btree (fk_view_id);


--
-- Name: nc_form_view_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_form_view_v2_oldpk_idx ON public.nc_form_view_v2 USING btree (fk_view_id);


--
-- Name: nc_fr_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_fr_context ON public.nc_file_references USING btree (base_id, fk_workspace_id);


--
-- Name: nc_fr_doc_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_fr_doc_idx ON public.nc_file_references USING btree (base_id, fk_doc_id);


--
-- Name: nc_fr_session_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_fr_session_idx ON public.nc_file_references USING btree (base_id, fk_session_id);


--
-- Name: nc_gallery_view_columns_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_gallery_view_columns_v2_base_id_fk_workspace_id_index ON public.nc_gallery_view_columns_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_gallery_view_columns_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_gallery_view_columns_v2_fk_column_id_index ON public.nc_gallery_view_columns_v2 USING btree (fk_column_id);


--
-- Name: nc_gallery_view_columns_v2_fk_view_id_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_gallery_view_columns_v2_fk_view_id_fk_column_id_index ON public.nc_gallery_view_columns_v2 USING btree (fk_view_id, fk_column_id);


--
-- Name: nc_gallery_view_columns_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_gallery_view_columns_v2_fk_view_id_index ON public.nc_gallery_view_columns_v2 USING btree (fk_view_id);


--
-- Name: nc_gallery_view_columns_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_gallery_view_columns_v2_oldpk_idx ON public.nc_gallery_view_columns_v2 USING btree (id);


--
-- Name: nc_gallery_view_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_gallery_view_v2_base_id_fk_workspace_id_index ON public.nc_gallery_view_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_gallery_view_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_gallery_view_v2_fk_view_id_index ON public.nc_gallery_view_v2 USING btree (fk_view_id);


--
-- Name: nc_gallery_view_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_gallery_view_v2_oldpk_idx ON public.nc_gallery_view_v2 USING btree (fk_view_id);


--
-- Name: nc_gcp_mp_accounts_link_token_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_gcp_mp_accounts_link_token_idx ON public.nc_gcp_marketplace_accounts USING btree (link_token);


--
-- Name: nc_gcp_mp_accounts_user_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_gcp_mp_accounts_user_idx ON public.nc_gcp_marketplace_accounts USING btree (fk_user_id);


--
-- Name: nc_gcp_mp_ent_account_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_gcp_mp_ent_account_idx ON public.nc_gcp_marketplace_entitlements USING btree (fk_gcp_account_id);


--
-- Name: nc_gcp_mp_ent_install_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_gcp_mp_ent_install_idx ON public.nc_gcp_marketplace_entitlements USING btree (fk_installation_id);


--
-- Name: nc_grid_view_columns_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_grid_view_columns_v2_base_id_fk_workspace_id_index ON public.nc_grid_view_columns_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_grid_view_columns_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_grid_view_columns_v2_fk_column_id_index ON public.nc_grid_view_columns_v2 USING btree (fk_column_id);


--
-- Name: nc_grid_view_columns_v2_fk_view_id_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_grid_view_columns_v2_fk_view_id_fk_column_id_index ON public.nc_grid_view_columns_v2 USING btree (fk_view_id, fk_column_id);


--
-- Name: nc_grid_view_columns_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_grid_view_columns_v2_fk_view_id_index ON public.nc_grid_view_columns_v2 USING btree (fk_view_id);


--
-- Name: nc_grid_view_columns_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_grid_view_columns_v2_oldpk_idx ON public.nc_grid_view_columns_v2 USING btree (id);


--
-- Name: nc_grid_view_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_grid_view_v2_base_id_fk_workspace_id_index ON public.nc_grid_view_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_grid_view_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_grid_view_v2_fk_view_id_index ON public.nc_grid_view_v2 USING btree (fk_view_id);


--
-- Name: nc_grid_view_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_grid_view_v2_oldpk_idx ON public.nc_grid_view_v2 USING btree (fk_view_id);


--
-- Name: nc_hook_logs_error_notify_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_hook_logs_error_notify_idx ON public.nc_hook_logs_v2 USING btree (error_notified_at);


--
-- Name: nc_hook_logs_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_hook_logs_v2_base_id_fk_workspace_id_index ON public.nc_hook_logs_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_hook_logs_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_hook_logs_v2_oldpk_idx ON public.nc_hook_logs_v2 USING btree (id);


--
-- Name: nc_hooks_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_hooks_v2_base_id_fk_workspace_id_index ON public.nc_hooks_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_hooks_v2_fk_model_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_hooks_v2_fk_model_id_index ON public.nc_hooks_v2 USING btree (fk_model_id);


--
-- Name: nc_hooks_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_hooks_v2_oldpk_idx ON public.nc_hooks_v2 USING btree (id);


--
-- Name: nc_il_integration_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_il_integration_idx ON public.nc_integration_links_v2 USING btree (fk_integration_id);


--
-- Name: nc_il_ws_base_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_il_ws_base_idx ON public.nc_integration_links_v2 USING btree (fk_workspace_id, base_id);


--
-- Name: nc_installations_fk_user_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_installations_fk_user_id_idx ON public.nc_installations USING btree (fk_user_id);


--
-- Name: nc_installations_license_key_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_installations_license_key_idx ON public.nc_installations USING btree (license_key);


--
-- Name: nc_integrations_store_v2_fk_integration_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_integrations_store_v2_fk_integration_id_index ON public.nc_integrations_store_v2 USING btree (fk_integration_id);


--
-- Name: nc_integrations_v2_created_by_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_integrations_v2_created_by_index ON public.nc_integrations_v2 USING btree (created_by);


--
-- Name: nc_integrations_v2_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_integrations_v2_fk_workspace_id_index ON public.nc_integrations_v2 USING btree (fk_workspace_id);


--
-- Name: nc_integrations_v2_type_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_integrations_v2_type_index ON public.nc_integrations_v2 USING btree (type);


--
-- Name: nc_jobs_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_jobs_context ON public.nc_jobs USING btree (base_id, fk_workspace_id);


--
-- Name: nc_kanban_view_columns_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_kanban_view_columns_v2_base_id_fk_workspace_id_index ON public.nc_kanban_view_columns_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_kanban_view_columns_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_kanban_view_columns_v2_fk_column_id_index ON public.nc_kanban_view_columns_v2 USING btree (fk_column_id);


--
-- Name: nc_kanban_view_columns_v2_fk_view_id_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_kanban_view_columns_v2_fk_view_id_fk_column_id_index ON public.nc_kanban_view_columns_v2 USING btree (fk_view_id, fk_column_id);


--
-- Name: nc_kanban_view_columns_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_kanban_view_columns_v2_fk_view_id_index ON public.nc_kanban_view_columns_v2 USING btree (fk_view_id);


--
-- Name: nc_kanban_view_columns_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_kanban_view_columns_v2_oldpk_idx ON public.nc_kanban_view_columns_v2 USING btree (id);


--
-- Name: nc_kanban_view_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_kanban_view_v2_base_id_fk_workspace_id_index ON public.nc_kanban_view_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_kanban_view_v2_fk_grp_col_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_kanban_view_v2_fk_grp_col_id_index ON public.nc_kanban_view_v2 USING btree (fk_grp_col_id);


--
-- Name: nc_kanban_view_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_kanban_view_v2_fk_view_id_index ON public.nc_kanban_view_v2 USING btree (fk_view_id);


--
-- Name: nc_kanban_view_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_kanban_view_v2_oldpk_idx ON public.nc_kanban_view_v2 USING btree (fk_view_id);


--
-- Name: nc_managed_app_deployment_logs_managed_app_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_managed_app_deployment_logs_managed_app_id_idx ON public.nc_managed_app_deployment_logs USING btree (fk_managed_app_id);


--
-- Name: nc_managed_app_versions_managed_app_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_managed_app_versions_managed_app_id_idx ON public.nc_managed_app_versions USING btree (fk_managed_app_id);


--
-- Name: nc_managed_app_versions_ordering_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_managed_app_versions_ordering_idx ON public.nc_managed_app_versions USING btree (fk_managed_app_id, version_number);


--
-- Name: nc_managed_app_versions_status_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_managed_app_versions_status_idx ON public.nc_managed_app_versions USING btree (fk_managed_app_id, status);


--
-- Name: nc_map_view_columns_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_map_view_columns_v2_base_id_fk_workspace_id_index ON public.nc_map_view_columns_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_map_view_columns_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_map_view_columns_v2_fk_column_id_index ON public.nc_map_view_columns_v2 USING btree (fk_column_id);


--
-- Name: nc_map_view_columns_v2_fk_view_id_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_map_view_columns_v2_fk_view_id_fk_column_id_index ON public.nc_map_view_columns_v2 USING btree (fk_view_id, fk_column_id);


--
-- Name: nc_map_view_columns_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_map_view_columns_v2_fk_view_id_index ON public.nc_map_view_columns_v2 USING btree (fk_view_id);


--
-- Name: nc_map_view_columns_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_map_view_columns_v2_oldpk_idx ON public.nc_map_view_columns_v2 USING btree (id);


--
-- Name: nc_map_view_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_map_view_v2_base_id_fk_workspace_id_index ON public.nc_map_view_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_map_view_v2_fk_geo_data_col_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_map_view_v2_fk_geo_data_col_id_index ON public.nc_map_view_v2 USING btree (fk_geo_data_col_id);


--
-- Name: nc_map_view_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_map_view_v2_fk_view_id_index ON public.nc_map_view_v2 USING btree (fk_view_id);


--
-- Name: nc_map_view_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_map_view_v2_oldpk_idx ON public.nc_map_view_v2 USING btree (fk_view_id);


--
-- Name: nc_mc_tokens_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_mc_tokens_context ON public.nc_mcp_tokens USING btree (base_id, fk_workspace_id);


--
-- Name: nc_mcp_tokens_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_mcp_tokens_oldpk_idx ON public.nc_mcp_tokens USING btree (id);


--
-- Name: nc_model_stats_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_model_stats_v2_base_id_fk_workspace_id_index ON public.nc_model_stats_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_model_stats_v2_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_model_stats_v2_fk_workspace_id_index ON public.nc_model_stats_v2 USING btree (fk_workspace_id);


--
-- Name: nc_model_stats_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_model_stats_v2_oldpk_idx ON public.nc_model_stats_v2 USING btree (fk_workspace_id, fk_model_id);


--
-- Name: nc_models_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_models_v2_base_id_fk_workspace_id_index ON public.nc_models_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_models_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_models_v2_oldpk_idx ON public.nc_models_v2 USING btree (id);


--
-- Name: nc_models_v2_source_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_models_v2_source_id_index ON public.nc_models_v2 USING btree (source_id);


--
-- Name: nc_models_v2_tree_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_models_v2_tree_idx ON public.nc_models_v2 USING btree (base_id, type, parent_id, "order");


--
-- Name: nc_models_v2_type_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_models_v2_type_index ON public.nc_models_v2 USING btree (type);


--
-- Name: nc_models_v2_uuid_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_models_v2_uuid_index ON public.nc_models_v2 USING btree (uuid);


--
-- Name: nc_oauth_authorization_codes_code_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_authorization_codes_code_index ON public.nc_oauth_authorization_codes USING btree (code);


--
-- Name: nc_oauth_authorization_codes_expires_at_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_authorization_codes_expires_at_index ON public.nc_oauth_authorization_codes USING btree (expires_at);


--
-- Name: nc_oauth_authorization_codes_fk_client_id_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_authorization_codes_fk_client_id_fk_user_id_index ON public.nc_oauth_authorization_codes USING btree (fk_client_id, fk_user_id);


--
-- Name: nc_oauth_authorization_codes_fk_client_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_authorization_codes_fk_client_id_index ON public.nc_oauth_authorization_codes USING btree (fk_client_id);


--
-- Name: nc_oauth_authorization_codes_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_authorization_codes_fk_user_id_index ON public.nc_oauth_authorization_codes USING btree (fk_user_id);


--
-- Name: nc_oauth_authorization_codes_is_used_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_authorization_codes_is_used_index ON public.nc_oauth_authorization_codes USING btree (is_used);


--
-- Name: nc_oauth_clients_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_clients_fk_user_id_index ON public.nc_oauth_clients USING btree (fk_user_id);


--
-- Name: nc_oauth_tokens_access_token_expires_at_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_tokens_access_token_expires_at_index ON public.nc_oauth_tokens USING btree (access_token_expires_at);


--
-- Name: nc_oauth_tokens_access_token_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_tokens_access_token_index ON public.nc_oauth_tokens USING btree (access_token);


--
-- Name: nc_oauth_tokens_fk_client_id_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_tokens_fk_client_id_fk_user_id_index ON public.nc_oauth_tokens USING btree (fk_client_id, fk_user_id);


--
-- Name: nc_oauth_tokens_fk_client_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_tokens_fk_client_id_index ON public.nc_oauth_tokens USING btree (fk_client_id);


--
-- Name: nc_oauth_tokens_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_tokens_fk_user_id_index ON public.nc_oauth_tokens USING btree (fk_user_id);


--
-- Name: nc_oauth_tokens_is_revoked_access_token_expires_at_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_tokens_is_revoked_access_token_expires_at_index ON public.nc_oauth_tokens USING btree (is_revoked, access_token_expires_at);


--
-- Name: nc_oauth_tokens_is_revoked_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_tokens_is_revoked_index ON public.nc_oauth_tokens USING btree (is_revoked);


--
-- Name: nc_oauth_tokens_last_used_at_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_tokens_last_used_at_index ON public.nc_oauth_tokens USING btree (last_used_at);


--
-- Name: nc_oauth_tokens_refresh_token_expires_at_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_tokens_refresh_token_expires_at_index ON public.nc_oauth_tokens USING btree (refresh_token_expires_at);


--
-- Name: nc_oauth_tokens_refresh_token_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_oauth_tokens_refresh_token_index ON public.nc_oauth_tokens USING btree (refresh_token);


--
-- Name: nc_org_domain_domain_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_org_domain_domain_index ON public.nc_org_domain USING btree (domain);


--
-- Name: nc_org_domain_fk_org_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_org_domain_fk_org_id_index ON public.nc_org_domain USING btree (fk_org_id);


--
-- Name: nc_org_domain_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_org_domain_fk_user_id_index ON public.nc_org_domain USING btree (fk_user_id);


--
-- Name: nc_org_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_org_fk_user_id_index ON public.nc_org USING btree (fk_user_id);


--
-- Name: nc_org_slug_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_org_slug_index ON public.nc_org USING btree (slug);


--
-- Name: nc_org_users_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_org_users_fk_user_id_index ON public.nc_org_users USING btree (fk_user_id);


--
-- Name: nc_org_users_scim_external_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_org_users_scim_external_id_idx ON public.nc_org_users USING btree (scim_external_id);


--
-- Name: nc_org_users_scim_managed_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_org_users_scim_managed_idx ON public.nc_org_users USING btree (scim_managed);


--
-- Name: nc_outline_view_columns_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_outline_view_columns_v2_base_id_fk_workspace_id_index ON public.nc_list_view_columns_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_outline_view_columns_v2_fk_view_id_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_outline_view_columns_v2_fk_view_id_fk_column_id_index ON public.nc_list_view_columns_v2 USING btree (fk_view_id, fk_column_id);


--
-- Name: nc_outline_view_columns_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_outline_view_columns_v2_fk_view_id_index ON public.nc_list_view_columns_v2 USING btree (fk_view_id);


--
-- Name: nc_outline_view_levels_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_outline_view_levels_v2_base_id_fk_workspace_id_index ON public.nc_list_view_levels_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_outline_view_levels_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_outline_view_levels_v2_fk_view_id_index ON public.nc_list_view_levels_v2 USING btree (fk_view_id);


--
-- Name: nc_outline_view_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_outline_view_v2_base_id_fk_workspace_id_index ON public.nc_list_view_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_outline_view_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_outline_view_v2_fk_view_id_index ON public.nc_list_view_v2 USING btree (fk_view_id);


--
-- Name: nc_permission_subjects_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_permission_subjects_context ON public.nc_permission_subjects USING btree (fk_workspace_id, base_id);


--
-- Name: nc_permission_subjects_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_permission_subjects_oldpk_idx ON public.nc_permission_subjects USING btree (fk_permission_id, subject_type, subject_id);


--
-- Name: nc_permissions_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_permissions_context ON public.nc_permissions USING btree (base_id, fk_workspace_id);


--
-- Name: nc_permissions_entity; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_permissions_entity ON public.nc_permissions USING btree (entity, entity_id, permission);


--
-- Name: nc_permissions_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_permissions_oldpk_idx ON public.nc_permissions USING btree (id);


--
-- Name: nc_plans_stripe_product_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_plans_stripe_product_idx ON public.nc_plans USING btree (stripe_product_id);


--
-- Name: nc_principal_assignments_principal_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_principal_assignments_principal_idx ON public.nc_principal_assignments USING btree (principal_type, principal_ref_id);


--
-- Name: nc_principal_assignments_principal_resource_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_principal_assignments_principal_resource_idx ON public.nc_principal_assignments USING btree (principal_type, principal_ref_id, resource_type);


--
-- Name: nc_principal_assignments_resource_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_principal_assignments_resource_idx ON public.nc_principal_assignments USING btree (resource_type, resource_id);


--
-- Name: nc_principal_assignments_resource_principal_type_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_principal_assignments_resource_principal_type_idx ON public.nc_principal_assignments USING btree (resource_type, resource_id, principal_type);


--
-- Name: nc_project_users_v2_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_project_users_v2_fk_user_id_index ON public.nc_base_users_v2 USING btree (fk_user_id);


--
-- Name: nc_record_audit_v2_tenant_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_record_audit_v2_tenant_idx ON public.nc_audit_v2 USING btree (base_id, fk_model_id, row_id, fk_workspace_id);


--
-- Name: nc_record_templates_base_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_record_templates_base_id_index ON public.nc_record_templates USING btree (base_id);


--
-- Name: nc_record_templates_fk_model_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_record_templates_fk_model_id_index ON public.nc_record_templates USING btree (fk_model_id);


--
-- Name: nc_record_templates_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_record_templates_fk_workspace_id_index ON public.nc_record_templates USING btree (fk_workspace_id);


--
-- Name: nc_rls_policies_model_default_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_rls_policies_model_default_idx ON public.nc_rls_policies USING btree (fk_model_id, is_default);


--
-- Name: nc_rls_policies_model_enabled_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_rls_policies_model_enabled_idx ON public.nc_rls_policies USING btree (fk_model_id, enabled);


--
-- Name: nc_rls_policy_subjects_context_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_rls_policy_subjects_context_idx ON public.nc_rls_policy_subjects USING btree (fk_workspace_id, base_id);


--
-- Name: nc_row_color_conditions_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_row_color_conditions_fk_view_id_index ON public.nc_row_color_conditions USING btree (fk_view_id);


--
-- Name: nc_row_color_conditions_fk_workspace_id_base_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_row_color_conditions_fk_workspace_id_base_id_index ON public.nc_row_color_conditions USING btree (fk_workspace_id, base_id);


--
-- Name: nc_row_color_conditions_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_row_color_conditions_oldpk_idx ON public.nc_row_color_conditions USING btree (id);


--
-- Name: nc_sandbox_deployment_logs_base_created_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandbox_deployment_logs_base_created_idx ON public.nc_managed_app_deployment_logs USING btree (base_id, created_at);


--
-- Name: nc_sandbox_deployment_logs_base_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandbox_deployment_logs_base_id_idx ON public.nc_managed_app_deployment_logs USING btree (base_id);


--
-- Name: nc_sandbox_deployment_logs_from_version_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandbox_deployment_logs_from_version_idx ON public.nc_managed_app_deployment_logs USING btree (from_version_id);


--
-- Name: nc_sandbox_deployment_logs_status_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandbox_deployment_logs_status_idx ON public.nc_managed_app_deployment_logs USING btree (status);


--
-- Name: nc_sandbox_deployment_logs_to_version_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandbox_deployment_logs_to_version_idx ON public.nc_managed_app_deployment_logs USING btree (to_version_id);


--
-- Name: nc_sandbox_deployment_logs_workspace_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandbox_deployment_logs_workspace_id_idx ON public.nc_managed_app_deployment_logs USING btree (fk_workspace_id);


--
-- Name: nc_sandbox_versions_workspace_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandbox_versions_workspace_id_idx ON public.nc_managed_app_versions USING btree (fk_workspace_id);


--
-- Name: nc_sandboxes_base_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandboxes_base_id_idx ON public.nc_managed_apps USING btree (base_id);


--
-- Name: nc_sandboxes_category_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandboxes_category_idx ON public.nc_managed_apps USING btree (category);


--
-- Name: nc_sandboxes_created_by_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandboxes_created_by_idx ON public.nc_managed_apps USING btree (created_by);


--
-- Name: nc_sandboxes_deleted_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandboxes_deleted_idx ON public.nc_managed_apps USING btree (deleted);


--
-- Name: nc_sandboxes_v2_created_by_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandboxes_v2_created_by_idx ON public.nc_sandboxes_v2 USING btree (created_by);


--
-- Name: nc_sandboxes_v2_production_base_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandboxes_v2_production_base_id_idx ON public.nc_sandboxes_v2 USING btree (production_base_id);


--
-- Name: nc_sandboxes_v2_sandbox_base_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandboxes_v2_sandbox_base_id_idx ON public.nc_sandboxes_v2 USING btree (sandbox_base_id);


--
-- Name: nc_sandboxes_v2_workspace_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandboxes_v2_workspace_id_idx ON public.nc_sandboxes_v2 USING btree (fk_workspace_id);


--
-- Name: nc_sandboxes_visibility_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandboxes_visibility_idx ON public.nc_managed_apps USING btree (visibility);


--
-- Name: nc_sandboxes_workspace_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sandboxes_workspace_id_idx ON public.nc_managed_apps USING btree (fk_workspace_id);


--
-- Name: nc_scim_config_org_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_scim_config_org_idx ON public.nc_scim_config USING btree (fk_org_id);


--
-- Name: nc_scl_base_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_scl_base_id_index ON public.nc_sandbox_changelog USING btree (base_id);


--
-- Name: nc_scl_entity_type_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_scl_entity_type_id_index ON public.nc_sandbox_changelog USING btree (entity_type, entity_id);


--
-- Name: nc_scl_sandbox_seq_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_scl_sandbox_seq_index ON public.nc_sandbox_changelog USING btree (fk_sandbox_id, seq);


--
-- Name: nc_scripts_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_scripts_context ON public.nc_scripts USING btree (base_id, fk_workspace_id);


--
-- Name: nc_scripts_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_scripts_oldpk_idx ON public.nc_scripts USING btree (id);


--
-- Name: nc_snapshot_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_snapshot_context ON public.nc_snapshots USING btree (base_id, fk_workspace_id);


--
-- Name: nc_sort_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sort_v2_base_id_fk_workspace_id_index ON public.nc_sort_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_sort_v2_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sort_v2_fk_column_id_index ON public.nc_sort_v2 USING btree (fk_column_id);


--
-- Name: nc_sort_v2_fk_level_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sort_v2_fk_level_id_index ON public.nc_sort_v2 USING btree (fk_level_id);


--
-- Name: nc_sort_v2_fk_view_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sort_v2_fk_view_id_index ON public.nc_sort_v2 USING btree (fk_view_id);


--
-- Name: nc_sort_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sort_v2_oldpk_idx ON public.nc_sort_v2 USING btree (id);


--
-- Name: nc_source_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_source_v2_base_id_fk_workspace_id_index ON public.nc_sources_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_source_v2_fk_integration_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_source_v2_fk_integration_id_index ON public.nc_sources_v2 USING btree (fk_integration_id);


--
-- Name: nc_source_v2_fk_sql_executor_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_source_v2_fk_sql_executor_id_index ON public.nc_sources_v2 USING btree (fk_sql_executor_id);


--
-- Name: nc_sources_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sources_v2_oldpk_idx ON public.nc_sources_v2 USING btree (id);


--
-- Name: nc_sso_client_domain_name_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sso_client_domain_name_index ON public.nc_sso_client USING btree (domain_name);


--
-- Name: nc_sso_client_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sso_client_fk_user_id_index ON public.nc_sso_client USING btree (fk_user_id);


--
-- Name: nc_sso_client_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sso_client_fk_workspace_id_index ON public.nc_sso_client USING btree (fk_org_id);


--
-- Name: nc_store_key_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_store_key_index ON public.nc_store USING btree (key);


--
-- Name: nc_subscriptions_org_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_subscriptions_org_idx ON public.nc_subscriptions USING btree (fk_org_id);


--
-- Name: nc_subscriptions_stripe_subscription_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_subscriptions_stripe_subscription_idx ON public.nc_subscriptions USING btree (stripe_subscription_id);


--
-- Name: nc_subscriptions_ws_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_subscriptions_ws_idx ON public.nc_subscriptions USING btree (fk_workspace_id);


--
-- Name: nc_sync_configs_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sync_configs_context ON public.nc_sync_configs USING btree (base_id, fk_workspace_id);


--
-- Name: nc_sync_configs_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sync_configs_oldpk_idx ON public.nc_sync_configs USING btree (id);


--
-- Name: nc_sync_configs_parent_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sync_configs_parent_idx ON public.nc_sync_configs USING btree (fk_parent_sync_config_id);


--
-- Name: nc_sync_logs_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sync_logs_v2_base_id_fk_workspace_id_index ON public.nc_sync_logs_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_sync_logs_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sync_logs_v2_oldpk_idx ON public.nc_sync_logs_v2 USING btree (id);


--
-- Name: nc_sync_mappings_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sync_mappings_context ON public.nc_sync_mappings USING btree (base_id, fk_workspace_id);


--
-- Name: nc_sync_mappings_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sync_mappings_oldpk_idx ON public.nc_sync_mappings USING btree (id);


--
-- Name: nc_sync_mappings_sync_config_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sync_mappings_sync_config_idx ON public.nc_sync_mappings USING btree (fk_sync_config_id);


--
-- Name: nc_sync_source_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sync_source_v2_base_id_fk_workspace_id_index ON public.nc_sync_source_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_sync_source_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sync_source_v2_oldpk_idx ON public.nc_sync_source_v2 USING btree (id);


--
-- Name: nc_sync_source_v2_source_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_sync_source_v2_source_id_index ON public.nc_sync_source_v2 USING btree (source_id);


--
-- Name: nc_teams_created_by_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_teams_created_by_idx ON public.nc_teams USING btree (created_by);


--
-- Name: nc_teams_org_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_teams_org_idx ON public.nc_teams USING btree (fk_org_id);


--
-- Name: nc_teams_parent_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_teams_parent_idx ON public.nc_teams USING btree (fk_parent_team_id);


--
-- Name: nc_teams_scim_external_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_teams_scim_external_id_idx ON public.nc_teams USING btree (scim_external_id);


--
-- Name: nc_teams_scim_managed_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_teams_scim_managed_idx ON public.nc_teams USING btree (scim_managed);


--
-- Name: nc_teams_workspace_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_teams_workspace_idx ON public.nc_teams USING btree (fk_workspace_id);


--
-- Name: nc_timeline_view_columns_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_timeline_view_columns_v2_base_id_fk_workspace_id_index ON public.nc_timeline_view_columns_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_timeline_view_columns_v2_fk_view_id_fk_column_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_timeline_view_columns_v2_fk_view_id_fk_column_id_index ON public.nc_timeline_view_columns_v2 USING btree (fk_view_id, fk_column_id);


--
-- Name: nc_timeline_view_columns_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_timeline_view_columns_v2_oldpk_idx ON public.nc_timeline_view_columns_v2 USING btree (id);


--
-- Name: nc_timeline_view_range_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_timeline_view_range_v2_base_id_fk_workspace_id_index ON public.nc_timeline_view_range_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_timeline_view_range_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_timeline_view_range_v2_oldpk_idx ON public.nc_timeline_view_range_v2 USING btree (id);


--
-- Name: nc_timeline_view_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_timeline_view_v2_base_id_fk_workspace_id_index ON public.nc_timeline_view_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_timeline_view_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_timeline_view_v2_oldpk_idx ON public.nc_timeline_view_v2 USING btree (fk_view_id);


--
-- Name: nc_trash_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_trash_base_id_fk_workspace_id_index ON public.nc_trash USING btree (base_id, fk_workspace_id);


--
-- Name: nc_trash_cleanup_due_at_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_trash_cleanup_due_at_index ON public.nc_trash USING btree (cleanup_due_at);


--
-- Name: nc_usage_stats_ws_period_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_usage_stats_ws_period_idx ON public.nc_usage_stats USING btree (fk_workspace_id, period_start);


--
-- Name: nc_user_comment_notifications_preference_base_id_fk_workspace_i; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_user_comment_notifications_preference_base_id_fk_workspace_i ON public.nc_user_comment_notifications_preference USING btree (base_id, fk_workspace_id);


--
-- Name: nc_user_refresh_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_user_refresh_tokens_expires_at_index ON public.nc_user_refresh_tokens USING btree (expires_at);


--
-- Name: nc_user_refresh_tokens_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_user_refresh_tokens_fk_user_id_index ON public.nc_user_refresh_tokens USING btree (fk_user_id);


--
-- Name: nc_user_refresh_tokens_token_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_user_refresh_tokens_token_index ON public.nc_user_refresh_tokens USING btree (token);


--
-- Name: nc_users_v2_canonical_email_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_users_v2_canonical_email_index ON public.nc_users_v2 USING btree (canonical_email);


--
-- Name: nc_users_v2_email_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_users_v2_email_index ON public.nc_users_v2 USING btree (email);


--
-- Name: nc_view_sections_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_view_sections_context ON public.nc_view_sections USING btree (base_id, fk_workspace_id);


--
-- Name: nc_view_sections_model_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_view_sections_model_idx ON public.nc_view_sections USING btree (fk_model_id);


--
-- Name: nc_views_v2_base_id_fk_workspace_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_views_v2_base_id_fk_workspace_id_index ON public.nc_views_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_views_v2_created_by_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_views_v2_created_by_index ON public.nc_views_v2 USING btree (created_by);


--
-- Name: nc_views_v2_fk_custom_url_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_views_v2_fk_custom_url_id_index ON public.nc_views_v2 USING btree (fk_custom_url_id);


--
-- Name: nc_views_v2_fk_model_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_views_v2_fk_model_id_index ON public.nc_views_v2 USING btree (fk_model_id);


--
-- Name: nc_views_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_views_v2_oldpk_idx ON public.nc_views_v2 USING btree (id);


--
-- Name: nc_views_v2_owned_by_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_views_v2_owned_by_index ON public.nc_views_v2 USING btree (owned_by);


--
-- Name: nc_widgets_context; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_widgets_context ON public.nc_widgets_v2 USING btree (base_id, fk_workspace_id);


--
-- Name: nc_widgets_dashboard_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_widgets_dashboard_idx ON public.nc_widgets_v2 USING btree (fk_dashboard_id);


--
-- Name: nc_widgets_v2_oldpk_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_widgets_v2_oldpk_idx ON public.nc_widgets_v2 USING btree (id);


--
-- Name: nc_workflow_executions_context_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_workflow_executions_context_idx ON public.nc_automation_executions USING btree (base_id, fk_workspace_id);


--
-- Name: nc_workflow_executions_workflow_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_workflow_executions_workflow_idx ON public.nc_automation_executions USING btree (fk_workflow_id);


--
-- Name: nc_workflows_context_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_workflows_context_idx ON public.nc_workflows USING btree (base_id, fk_workspace_id);


--
-- Name: nc_workspace_user_scim_external_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_workspace_user_scim_external_id_idx ON public.workspace_user USING btree (scim_external_id);


--
-- Name: nc_workspace_user_scim_managed_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX nc_workspace_user_scim_managed_idx ON public.workspace_user USING btree (scim_managed);


--
-- Name: notification_created_at_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX notification_created_at_index ON public.notification USING btree (created_at);


--
-- Name: notification_fk_user_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX notification_fk_user_id_index ON public.notification USING btree (fk_user_id);


--
-- Name: notifications_user_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX notifications_user_idx ON public.notifications USING btree (user_id, is_read, created_at DESC);


--
-- Name: org_domain_fk_workspace_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX org_domain_fk_workspace_id_idx ON public.nc_org_domain USING btree (fk_workspace_id);


--
-- Name: share_uuid_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX share_uuid_idx ON public.nc_dashboards_v2 USING btree (uuid);


--
-- Name: sso_client_fk_workspace_id_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX sso_client_fk_workspace_id_idx ON public.nc_sso_client USING btree (fk_workspace_id);


--
-- Name: sync_configs_integration_model; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX sync_configs_integration_model ON public.nc_sync_configs USING btree (fk_model_id, fk_integration_id);


--
-- Name: user_comments_preference_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX user_comments_preference_index ON public.nc_user_comment_notifications_preference USING btree (user_id, row_id, fk_model_id);


--
-- Name: work_orders_due_date_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX work_orders_due_date_idx ON public.work_orders USING btree (due_date);


--
-- Name: work_orders_owner_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX work_orders_owner_idx ON public.work_orders USING btree (owner);


--
-- Name: work_orders_status_idx; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX work_orders_status_idx ON public.work_orders USING btree (status);


--
-- Name: workspace_fk_org_id_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX workspace_fk_org_id_index ON public.workspace USING btree (fk_org_id);


--
-- Name: workspace_user_invited_by_index; Type: INDEX; Schema: public; Owner: diversified
--

CREATE INDEX workspace_user_invited_by_index ON public.workspace_user USING btree (invited_by);


--
-- Name: calendar_blocks trg_calendar_blocks_updated_at; Type: TRIGGER; Schema: public; Owner: diversified
--

CREATE TRIGGER trg_calendar_blocks_updated_at BEFORE UPDATE ON public.calendar_blocks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: documents trg_documents_updated_at; Type: TRIGGER; Schema: public; Owner: diversified
--

CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_documents_updated_at();


--
-- Name: documents trg_documents_updated_at_os; Type: TRIGGER; Schema: public; Owner: diversified
--

CREATE TRIGGER trg_documents_updated_at_os BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: files trg_files_updated_at; Type: TRIGGER; Schema: public; Owner: diversified
--

CREATE TRIGGER trg_files_updated_at BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: requests trg_generate_request_id; Type: TRIGGER; Schema: public; Owner: diversified
--

CREATE TRIGGER trg_generate_request_id BEFORE INSERT ON public.requests FOR EACH ROW EXECUTE FUNCTION public.fn_generate_request_id();


--
-- Name: sop_run_steps trg_sop_run_steps_updated_at; Type: TRIGGER; Schema: public; Owner: diversified
--

CREATE TRIGGER trg_sop_run_steps_updated_at BEFORE UPDATE ON public.sop_run_steps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sop_runs trg_sop_runs_updated_at; Type: TRIGGER; Schema: public; Owner: diversified
--

CREATE TRIGGER trg_sop_runs_updated_at BEFORE UPDATE ON public.sop_runs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sop_steps trg_sop_steps_updated_at; Type: TRIGGER; Schema: public; Owner: diversified
--

CREATE TRIGGER trg_sop_steps_updated_at BEFORE UPDATE ON public.sop_steps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: work_orders trg_work_orders_updated_at; Type: TRIGGER; Schema: public; Owner: diversified
--

CREATE TRIGGER trg_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.set_work_orders_updated_at();


--
-- Name: document_audit_logs document_audit_logs_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.document_audit_logs
    ADD CONSTRAINT document_audit_logs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_audit_logs document_audit_logs_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.document_audit_logs
    ADD CONSTRAINT document_audit_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: document_signatures document_signatures_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.document_signatures
    ADD CONSTRAINT document_signatures_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_versions document_versions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: documents documents_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);


--
-- Name: documents documents_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: documents documents_signed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_signed_by_fkey FOREIGN KEY (signed_by) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: file_records file_records_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.file_records
    ADD CONSTRAINT file_records_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: forms forms_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.forms
    ADD CONSTRAINT forms_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.employees(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: sop_approvals sop_approvals_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_approvals
    ADD CONSTRAINT sop_approvals_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.employees(id);


--
-- Name: sop_approvals sop_approvals_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_approvals
    ADD CONSTRAINT sop_approvals_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.employees(id);


--
-- Name: sop_approvals sop_approvals_sop_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_approvals
    ADD CONSTRAINT sop_approvals_sop_run_id_fkey FOREIGN KEY (sop_run_id) REFERENCES public.sop_runs(id) ON DELETE CASCADE;


--
-- Name: sop_approvals sop_approvals_sop_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_approvals
    ADD CONSTRAINT sop_approvals_sop_step_id_fkey FOREIGN KEY (sop_step_id) REFERENCES public.sop_steps(id) ON DELETE RESTRICT;


--
-- Name: sop_run_steps sop_run_steps_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_run_steps
    ADD CONSTRAINT sop_run_steps_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.employees(id);


--
-- Name: sop_run_steps sop_run_steps_sop_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_run_steps
    ADD CONSTRAINT sop_run_steps_sop_run_id_fkey FOREIGN KEY (sop_run_id) REFERENCES public.sop_runs(id) ON DELETE CASCADE;


--
-- Name: sop_run_steps sop_run_steps_sop_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_run_steps
    ADD CONSTRAINT sop_run_steps_sop_step_id_fkey FOREIGN KEY (sop_step_id) REFERENCES public.sop_steps(id) ON DELETE RESTRICT;


--
-- Name: sop_runs sop_runs_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_runs
    ADD CONSTRAINT sop_runs_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.employees(id);


--
-- Name: sop_runs sop_runs_current_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_runs
    ADD CONSTRAINT sop_runs_current_step_id_fkey FOREIGN KEY (current_step_id) REFERENCES public.sop_steps(id);


--
-- Name: sop_runs sop_runs_sop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_runs
    ADD CONSTRAINT sop_runs_sop_id_fkey FOREIGN KEY (sop_id) REFERENCES public.sops(id) ON DELETE RESTRICT;


--
-- Name: sop_runs sop_runs_started_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_runs
    ADD CONSTRAINT sop_runs_started_by_fkey FOREIGN KEY (started_by) REFERENCES public.employees(id);


--
-- Name: sop_steps sop_steps_sop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sop_steps
    ADD CONSTRAINT sop_steps_sop_id_fkey FOREIGN KEY (sop_id) REFERENCES public.sops(id) ON DELETE CASCADE;


--
-- Name: sops sops_owner_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.sops
    ADD CONSTRAINT sops_owner_fkey FOREIGN KEY (owner) REFERENCES public.employees(id);


--
-- Name: tasks tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.employees(id);


--
-- Name: timeclock_entries timeclock_entries_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.timeclock_entries
    ADD CONSTRAINT timeclock_entries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: timesheets timesheets_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: work_orders work_orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: work_orders work_orders_owner_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_owner_fkey FOREIGN KEY (owner) REFERENCES public.employees(id);


--
-- Name: work_orders work_orders_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: diversified
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict IuFJTOntnywpU2pL0HJfM0D1eUburc1cFAPpQofkWKaXDf8yJaKeh42jqzB9ZZA

