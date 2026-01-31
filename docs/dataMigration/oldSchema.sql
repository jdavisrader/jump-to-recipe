-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION postgres;

-- DROP SEQUENCE public.active_storage_attachments_id_seq;

CREATE SEQUENCE public.active_storage_attachments_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.active_storage_blobs_id_seq;

CREATE SEQUENCE public.active_storage_blobs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.active_storage_variant_records_id_seq;

CREATE SEQUENCE public.active_storage_variant_records_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.ingredients_id_seq;

CREATE SEQUENCE public.ingredients_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.instructions_id_seq;

CREATE SEQUENCE public.instructions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.recipe_tags_id_seq;

CREATE SEQUENCE public.recipe_tags_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.recipes_id_seq;

CREATE SEQUENCE public.recipes_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.tags_id_seq;

CREATE SEQUENCE public.tags_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.users_id_seq;

CREATE SEQUENCE public.users_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;-- public.active_storage_blobs definition

-- Drop table

-- DROP TABLE public.active_storage_blobs;

CREATE TABLE public.active_storage_blobs (
	id bigserial NOT NULL,
	"key" varchar NOT NULL,
	filename varchar NOT NULL,
	content_type varchar NULL,
	metadata text NULL,
	service_name varchar NOT NULL,
	byte_size int8 NOT NULL,
	checksum varchar NOT NULL,
	created_at timestamp NOT NULL,
	CONSTRAINT active_storage_blobs_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX index_active_storage_blobs_on_key ON public.active_storage_blobs USING btree (key);


-- public.ar_internal_metadata definition

-- Drop table

-- DROP TABLE public.ar_internal_metadata;

CREATE TABLE public.ar_internal_metadata (
	"key" varchar NOT NULL,
	value varchar NULL,
	created_at timestamp(6) NOT NULL,
	updated_at timestamp(6) NOT NULL,
	CONSTRAINT ar_internal_metadata_pkey PRIMARY KEY (key)
);


-- public.schema_migrations definition

-- Drop table

-- DROP TABLE public.schema_migrations;

CREATE TABLE public.schema_migrations (
	"version" varchar NOT NULL,
	CONSTRAINT schema_migrations_pkey PRIMARY KEY (version)
);


-- public.tags definition

-- Drop table

-- DROP TABLE public.tags;

CREATE TABLE public.tags (
	id bigserial NOT NULL,
	"name" varchar NULL,
	created_at timestamp(6) NOT NULL,
	updated_at timestamp(6) NOT NULL,
	CONSTRAINT tags_pkey PRIMARY KEY (id)
);


-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	id bigserial NOT NULL,
	email varchar DEFAULT ''::character varying NOT NULL,
	encrypted_password varchar DEFAULT ''::character varying NOT NULL,
	reset_password_token varchar NULL,
	reset_password_sent_at timestamp NULL,
	remember_created_at timestamp NULL,
	created_at timestamp(6) NOT NULL,
	updated_at timestamp(6) NOT NULL,
	username varchar NULL,
	super_user bool DEFAULT false NULL,
	CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX index_users_on_email ON public.users USING btree (email);
CREATE UNIQUE INDEX index_users_on_reset_password_token ON public.users USING btree (reset_password_token);


-- public.active_storage_attachments definition

-- Drop table

-- DROP TABLE public.active_storage_attachments;

CREATE TABLE public.active_storage_attachments (
	id bigserial NOT NULL,
	"name" varchar NOT NULL,
	record_type varchar NOT NULL,
	record_id int8 NOT NULL,
	blob_id int8 NOT NULL,
	created_at timestamp NOT NULL,
	CONSTRAINT active_storage_attachments_pkey PRIMARY KEY (id),
	CONSTRAINT fk_rails_c3b3935057 FOREIGN KEY (blob_id) REFERENCES public.active_storage_blobs(id)
);
CREATE INDEX index_active_storage_attachments_on_blob_id ON public.active_storage_attachments USING btree (blob_id);
CREATE UNIQUE INDEX index_active_storage_attachments_uniqueness ON public.active_storage_attachments USING btree (record_type, record_id, name, blob_id);


-- public.active_storage_variant_records definition

-- Drop table

-- DROP TABLE public.active_storage_variant_records;

CREATE TABLE public.active_storage_variant_records (
	id bigserial NOT NULL,
	blob_id int8 NOT NULL,
	variation_digest varchar NOT NULL,
	CONSTRAINT active_storage_variant_records_pkey PRIMARY KEY (id),
	CONSTRAINT fk_rails_993965df05 FOREIGN KEY (blob_id) REFERENCES public.active_storage_blobs(id)
);
CREATE UNIQUE INDEX index_active_storage_variant_records_uniqueness ON public.active_storage_variant_records USING btree (blob_id, variation_digest);


-- public.recipes definition

-- Drop table

-- DROP TABLE public.recipes;

CREATE TABLE public.recipes (
	id bigserial NOT NULL,
	"name" varchar NULL,
	user_id int8 NOT NULL,
	description text NULL,
	servings int4 NULL,
	prep_time float8 NULL,
	prep_time_descriptor varchar NULL,
	cook_time float8 NULL,
	cook_time_descriptor varchar NULL,
	rest_time float8 NULL,
	rest_time_descriptor varchar NULL,
	total_time float8 NULL,
	total_time_descriptor varchar NULL,
	calories int4 NULL,
	created_at timestamp(6) NOT NULL,
	updated_at timestamp(6) NOT NULL,
	original_url varchar NULL,
	imported_recipe bool NULL,
	CONSTRAINT recipes_pkey PRIMARY KEY (id),
	CONSTRAINT fk_rails_9606fce865 FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE INDEX index_recipes_on_user_id ON public.recipes USING btree (user_id);


-- public.ingredients definition

-- Drop table

-- DROP TABLE public.ingredients;

CREATE TABLE public.ingredients (
	id bigserial NOT NULL,
	order_number int4 NULL,
	recipe_id int8 NOT NULL,
	created_at timestamp(6) NOT NULL,
	updated_at timestamp(6) NOT NULL,
	ingredient varchar NULL,
	CONSTRAINT ingredients_pkey PRIMARY KEY (id),
	CONSTRAINT fk_rails_3ee351e1cd FOREIGN KEY (recipe_id) REFERENCES public.recipes(id)
);
CREATE INDEX index_ingredients_on_recipe_id ON public.ingredients USING btree (recipe_id);


-- public.instructions definition

-- Drop table

-- DROP TABLE public.instructions;

CREATE TABLE public.instructions (
	id bigserial NOT NULL,
	step_number int4 NULL,
	step text NULL,
	recipe_id int8 NOT NULL,
	created_at timestamp(6) NOT NULL,
	updated_at timestamp(6) NOT NULL,
	CONSTRAINT instructions_pkey PRIMARY KEY (id),
	CONSTRAINT fk_rails_70ae839088 FOREIGN KEY (recipe_id) REFERENCES public.recipes(id)
);
CREATE INDEX index_instructions_on_recipe_id ON public.instructions USING btree (recipe_id);


-- public.recipe_tags definition

-- Drop table

-- DROP TABLE public.recipe_tags;

CREATE TABLE public.recipe_tags (
	id bigserial NOT NULL,
	tag_id int8 NOT NULL,
	recipe_id int8 NOT NULL,
	created_at timestamp(6) NOT NULL,
	updated_at timestamp(6) NOT NULL,
	CONSTRAINT recipe_tags_pkey PRIMARY KEY (id),
	CONSTRAINT fk_rails_8be1465117 FOREIGN KEY (recipe_id) REFERENCES public.recipes(id),
	CONSTRAINT fk_rails_fff0fb5d25 FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE INDEX index_recipe_tags_on_recipe_id ON public.recipe_tags USING btree (recipe_id);
CREATE INDEX index_recipe_tags_on_tag_id ON public.recipe_tags USING btree (tag_id);